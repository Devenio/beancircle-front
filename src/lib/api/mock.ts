import { handleMockRequest } from './mock-handler';

export function isMockMode(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
  );
}

export async function fetchMock<T>(
  path: string,
  options: RequestInit & { locale?: string } = {},
): Promise<T> {
  await new Promise((r) => setTimeout(r, 150));
  return handleMockRequest<T>(path, options);
}
