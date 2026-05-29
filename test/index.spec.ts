import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const env = {
	SUPABASE_URL: "https://supabase.test",
	SUPABASE_KEY: "service-key",
	JWT_SECRET: "jwt-secret"
};

describe("API worker", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns an API status response", async () => {
		const ctx = createExecutionContext();
		const response = await worker.fetch(new Request("http://example.com"), env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			success: true,
			message: "Success",
			data: "API is running 🚀"
		});
	});

	it("wraps properties list data in a Worker Response", async () => {
		const fetchMock = vi.fn(async () => {
			return new Response(JSON.stringify([{ id: 1, title: "Villa" }]), {
				headers: { "Content-Type": "application/json" }
			});
		});
		vi.stubGlobal("fetch", fetchMock);

		const ctx = createExecutionContext();
		const response = await worker.fetch(
			new Request("http://example.com/api/properties"),
			env,
			ctx
		);
		await waitOnExecutionContext(ctx);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://supabase.test/rest/v1/properties?select=*",
			expect.objectContaining({
				headers: expect.objectContaining({
					apikey: "service-key",
					Authorization: "Bearer service-key"
				})
			})
		);
		expect(await response.json()).toEqual({
			success: true,
			message: "Properties fetched successfully",
			data: [{ id: 1, title: "Villa" }]
		});
	});
});
