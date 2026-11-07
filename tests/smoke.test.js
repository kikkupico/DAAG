import { describe, it, expect } from "vitest";
import { BOOKS, loadBook } from "./harness.js";
describe.each(BOOKS)("%s", slug => {
  it("loads without script errors", async () => {
    const b = await loadBook(slug);
    expect(b.errors).toEqual([]); b.close();
  });
});
