import {SnippetOperations} from "../snippetOperations";
import {FakeSnippetOperations} from "../mock/fakeSnippetOperations";
import {HttpSnippetOperations} from "./httpSnippetOperations";
import {findOtherUsers} from "../devUser.ts";

type HttpMethods = keyof HttpSnippetOperations

/**
 * Snippet-service operations go to the real backend; everything the
 * snippet-service does not provide (tests, rules, formatting, file types)
 * is still served by the mock implementation. The user search comes from the
 * dev user list until the Auth0 user search exists.
 */
export const createHybridSnippetOperations = (): SnippetOperations => {
  const http = new HttpSnippetOperations()
  const fake = new FakeSnippetOperations()

  const httpMethods: HttpMethods[] = [
    'createSnippet',
    'listSnippetDescriptors',
    'getSnippetById',
    'updateSnippetById',
    'updateSnippetFull',
    'createSnippetFromFile',
    'updateSnippetFromFile',
    'downloadSnippet',
    'deleteSnippet',
    'shareSnippet',
  ]

  const operations: SnippetOperations = fake
  const overrides: Partial<SnippetOperations> = {
    ...Object.fromEntries(
        httpMethods.map(method => [method, http[method].bind(http)])
    ),
    getUserFriends: (name?: string, page?: number, pageSize?: number) =>
        Promise.resolve(findOtherUsers(name, page, pageSize)),
  }

  return Object.assign(Object.create(operations), overrides) as SnippetOperations
}
