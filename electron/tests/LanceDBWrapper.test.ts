import LanceDBTableWrapper from "electron/main/vector-database/lanceTableWrapper";
import { Table } from "apache-arrow";

/* Setting up mockImplementation for search result on lanceDB*/
jest.mock('lancedb@lancedb', () => {
    return {
        LanceDBTable: jest.fn().mockImplementation(() => {
            return {
                search: jest.fn()
            };
        })
    };
});

describe('LanceDBWrapper - Search Function', () => {
    let wrapperInstance: any;

    beforeEach(() => {
        wrapperInstance = new LanceDBTableWrapper();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Should return results when search is successful', async () => {
        // const mockSearchResults = [{ id: 1, name: 'Test Result' }]
        // wrapperInstance.search.mockResolvedValue(mockSearchResults)

        const searchQuery = "What are my notes on embedding models?"
        const wrapperResults = await wrapperInstance.search(searchQuery)
        
        expect(wrapperResults.search).toHaveBeenCalledWith(searchQuery)
        expect(wrapperResults).toEqual("NOT YET IMPLEMENTED!")
    })
})