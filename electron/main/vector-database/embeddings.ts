import path from 'path'

import { Pipeline, PreTrainedTokenizer } from '@xenova/transformers'
import { app } from 'electron'
import removeMd from 'remove-markdown'
import { EmbeddingFunction } from '@lancedb/lancedb/dist/embedding'

import { Float32 } from 'apache-arrow'
import {
  EmbeddingModelConfig,
  EmbeddingModelWithLocalPath,
  EmbeddingModelWithRepo,
} from '../electron-store/storeConfig'
import { splitDirectoryPathIntoBaseAndRepo } from '../filesystem/filesystem'

import DownloadModelFilesFromHFRepo from './downloadModelsFromHF'
import { DBEntry } from './schema'
import { EmbedType } from '../filesystem/types'

export const defaultEmbeddingModelRepos = {
  'Xenova/UAE-Large-V1': { type: 'repo', repoName: 'Xenova/UAE-Large-V1' },
  'Xenova/bge-base-en-v1.5': {
    type: 'repo',
    repoName: 'Xenova/bge-base-en-v1.5',
  },
  'Xenova/bge-small-en-v1.5': {
    type: 'repo',
    repoName: 'Xenova/bge-small-en-v1.5',
  },
}

function setupTokenizeFunction(tokenizer: PreTrainedTokenizer): (data: (string | number[])[]) => string[] {
  return (data: (string | number[])[]): string[] => {
    if (!tokenizer) {
      throw new Error('Tokenizer not initialized')
    }

    return data.map((text) => {
      const res = tokenizer(text)
      return res
    })
  }
}

async function setupEmbedFunction(pipe: Pipeline): Promise<(batch: (string | number[])[]) => Promise<number[][]>> {
  return async (batch: (string | number[])[]): Promise<number[][]> => {
    if (batch.length === 0 || batch[0].length === 0) {
      return []
    }

    if (typeof batch[0][0] === 'number') {
      return batch as number[][]
    }

    if (!pipe) {
      throw new Error('Pipeline not initialized')
    }

    const result: number[][] = await Promise.all(
      batch.map(async (text) => {
        const res = await pipe(removeMd(text as string), {
          pooling: 'mean',
          normalize: true,
        })
        return Array.from(res.data)
      }),
    )

    return result
  }
}

// EnhancedEmbeddingFunction class definition
export class EnhancedEmbeddingFunction<T extends EmbedType> extends EmbeddingFunction<T> {
  name: string

  contextLength: number

  sourceColumn: string

  embed: (batch: (string | number[])[]) => Promise<number[][]>

  tokenize: (data: (string | number[])[]) => string[]

  constructor(params: {
    name: string
    contextLength: number
    sourceColumn: string
    embed: (batch: (string | number[])[]) => Promise<number[][]>
    tokenize: (data: (string | number[])[]) => string[]
  }) {
    // Call super to invoke the constructor of the parent class
    super()
    this.name = params.name
    this.contextLength = params.contextLength
    this.sourceColumn = params.sourceColumn
    this.embed = params.embed
    this.tokenize = params.tokenize
  }

  toJSON(): Partial<FunctionOptions> {
    return {
      name: this.name,
      contextLength: this.contextLength,
      sourceColumn: this.sourceColumn,
    }
  }

  /* eslint-disable-next-line class-methods-use-this */
  embeddingDataType(): Float32 {
    return new Float32()
  }

  async computeSourceEmbeddings(data: T[]): Promise<number[][]> {
    return this.embed(data)
  }

  async computeQueryEmbeddings(data: T): Promise<number[]> {
    const embeddings = await this.computeSourceEmbeddings([data])
    return embeddings[0]
  }

  ndims(): number | undefined {
    return this.contextLength
  }
}

export async function createEmbeddingFunctionForLocalModel(
  embeddingModelConfig: EmbeddingModelWithLocalPath,
  sourceColumn: string,
): Promise<EnhancedEmbeddingFunction<string | number[]>> {
  // let pipe: Pipeline
  let repoName = ''
  let functionName = ''
  const { pipeline, env } = await import('@xenova/transformers')
  env.cacheDir = path.join(app.getPath('userData'), 'models', 'embeddings') // set for all. Just to deal with library and remote inconsistencies

  const pathParts = splitDirectoryPathIntoBaseAndRepo(embeddingModelConfig.localPath)

  env.localModelPath = pathParts.localModelPath
  repoName = pathParts.repoName
  env.allowRemoteModels = false
  functionName = embeddingModelConfig.localPath

  const pipe: Pipeline = (await pipeline(
    'feature-extraction',
    repoName,
    // {cache_dir: cacheDir,
  )) as Pipeline

  const tokenize = setupTokenizeFunction(pipe.tokenizer)
  const embed = await setupEmbedFunction(pipe)

  return new EnhancedEmbeddingFunction({
    name: functionName,
    contextLength: pipe.model.config.hidden_size,
    sourceColumn,
    embed,
    tokenize,
  })
}

export async function createEmbeddingFunctionForRepo(
  embeddingModelConfig: EmbeddingModelWithRepo,
  sourceColumn: string,
): Promise<EnhancedEmbeddingFunction<string | number[]>> {
  let pipe: Pipeline
  let repoName = ''
  let functionName = ''
  const { pipeline, env } = await import('@xenova/transformers')
  env.cacheDir = path.join(app.getPath('userData'), 'models', 'embeddings') // set for all. Just to deal with library and remote inconsistencies

  repoName = embeddingModelConfig.repoName
  env.allowRemoteModels = true
  functionName = embeddingModelConfig.repoName

  try {
    pipe = (await pipeline('feature-extraction', repoName)) as Pipeline
  } catch (error) {
    await DownloadModelFilesFromHFRepo(repoName, env.cacheDir) // try to manual download to use system proxy
    pipe = (await pipeline('feature-extraction', repoName)) as Pipeline
  }

  const tokenize = setupTokenizeFunction(pipe.tokenizer)
  const embed = await setupEmbedFunction(pipe)

  // sanitize the embedding text to remove markdown content

  return new EnhancedEmbeddingFunction({
    name: functionName,
    contextLength: pipe.model.config.hidden_size,
    sourceColumn,
    embed,
    tokenize,
  })
}

interface FunctionOptions {
  name: string
  contextLength: number
  sourceColumn: string
  embed: (batch: (string | number[])[]) => Promise<number[][]>
  tokenize: (data: EmbedType[]) => string[]
}

export async function createEmbeddingFunction(
  embeddingModelConfig: EmbeddingModelConfig,
  sourceColumn: string,
): Promise<EnhancedEmbeddingFunction<string | number[]>> {
  if (embeddingModelConfig.type === 'local') {
    return createEmbeddingFunctionForLocalModel(embeddingModelConfig, sourceColumn)
  }
  return createEmbeddingFunctionForRepo(embeddingModelConfig, sourceColumn)
}

export const rerankSearchedEmbeddings = async (query: string, searchResults: DBEntry[]) => {
  const { env, AutoModelForSequenceClassification, AutoTokenizer } = await import('@xenova/transformers')
  env.cacheDir = path.join(app.getPath('userData'), 'models', 'reranker') // set for all. Just to deal with library and remote inconsistencies

  const tokenizer = await AutoTokenizer.from_pretrained('Xenova/bge-reranker-base')
  const model = await AutoModelForSequenceClassification.from_pretrained('Xenova/bge-reranker-base')

  const queries = Array(searchResults.length).fill(query)

  const inputs = tokenizer(queries, {
    text_pair: searchResults.map((item) => item.content),
    padding: true,
    truncation: true,
  })

  const scores = await model(inputs)
  // map logits to searchResults by index
  const resultsWithIndex = searchResults.map((item, index) => ({
    ...item,
    score: scores.logits.data[index],
  }))

  // TODO: we should allow users to set threshold for sensitivity too.
  return resultsWithIndex.sort((a, b) => b.score - a.score).filter((item) => item.score > 0)
}
