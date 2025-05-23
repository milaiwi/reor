import { Schema, Field, Utf8, FixedSizeList, Float32, Float64, DateUnit, Date_ as ArrowDate } from 'apache-arrow'

export interface DBEntry {
  name: string
  notepath: string
  content: string
  subnoteindex: number
  timeadded: Date
  filemodified: Date
  filecreated: Date
  blockStartingPos?: number
  headingContext?: string
}
export interface DBQueryResult extends DBEntry {
  _distance: number
}

export const chunksize = 500

export enum DatabaseFields {
  NAME = 'name',
  NOTE_PATH = 'notepath',
  VECTOR = 'vector',
  CONTENT = 'content',
  SUB_NOTE_INDEX = 'subnoteindex',
  TIME_ADDED = 'timeadded',
  FILE_MODIFIED = 'filemodified',
  FILE_CREATED = 'filecreated',
  BLOCK_STARTING_POS = 'blockStartingPos',
  HEADING_CONTEXT = 'headingContext',
  DISTANCE = '_distance',
}

const CreateDatabaseSchema = (vectorDim: number): Schema => {
  const schemaFields = [
    new Field(DatabaseFields.NAME, new Utf8(), false),
    new Field(DatabaseFields.NOTE_PATH, new Utf8(), false),
    new Field(DatabaseFields.VECTOR, new FixedSizeList(vectorDim, new Field('item', new Float32())), false),
    new Field(DatabaseFields.CONTENT, new Utf8(), false),
    new Field(DatabaseFields.SUB_NOTE_INDEX, new Float64(), false),
    new Field(DatabaseFields.TIME_ADDED, new ArrowDate(DateUnit.MILLISECOND), false),
    new Field(DatabaseFields.FILE_MODIFIED, new ArrowDate(DateUnit.MILLISECOND), false),
    new Field(DatabaseFields.FILE_CREATED, new ArrowDate(DateUnit.MILLISECOND), false),
    new Field(DatabaseFields.BLOCK_STARTING_POS, new Float64(), true),
    new Field(DatabaseFields.HEADING_CONTEXT, new Utf8(), true),
  ]
  const schema = new Schema(schemaFields)
  return schema
}

const serializeSchema = (schema: Schema): string =>
  JSON.stringify(
    schema.fields.map((field) => ({
      name: field.name,
      type: field.type.toString(),
      nullable: field.nullable,
    })),
  )

export const isStringifiedSchemaEqual = (schema1: Schema, schema2: Schema): boolean => {
  const serializedSchema1 = serializeSchema(schema1)
  const serializedSchema2 = serializeSchema(schema2)

  const areEqual = serializedSchema1 === serializedSchema2
  return areEqual
}

export default CreateDatabaseSchema
