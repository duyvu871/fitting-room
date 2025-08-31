import { PlaygroundConfig } from 'app/sections/playground/schema';
import { ApiResponse } from 'app/utils/response';

// Type for the Prisma Playground model
export interface IPlayground {
  id: string;
  slug: string;
  name: string;
  config: PlaygroundConfig;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export type PlaygroundListResponse = ApiResponse<IPlayground[]>;
export type PlaygroundSingleResponse = ApiResponse<IPlayground>;

// Payload types for API requests
export interface PlaygroundCreatePayload {
  name?: string;
  config?: PlaygroundConfig;
}

export interface PlaygroundUpdatePayload {
  name?: string;
  config?: PlaygroundConfig;
}
