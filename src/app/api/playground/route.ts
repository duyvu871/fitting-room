import { nanoid } from 'nanoid';
import { Playground } from 'db/client';
import { ZodIssue } from 'zod';
import db from 'app/lib/db';
import { withApiErrorHandling } from 'app/utils/with-error-handling';
import { apiSuccess, ValidationError } from 'app/utils/response';
import { PlaygroundConfigSchema } from 'app/sections/playground/schema';

export const GET = withApiErrorHandling<Playground[]>(async (req: Request, { params }) => {
  const items = await db.playground.findMany({ orderBy: { updatedAt: 'desc' } });
  return apiSuccess(items, 'Playgrounds retrieved successfully');
});

export const POST = withApiErrorHandling<Playground>(async (req: Request) => {
  const body = await req.json();

  // Validate body against a schema if necessary (e.g., if you expect specific fields for creating a playground)
  // For now, let's assume `name` is optional and `config` is a `PlaygroundConfig`
  const result = PlaygroundConfigSchema.safeParse(body.config);

  if (!result.success) {
    throw new ValidationError('Invalid playground configuration', {
      issues: result.error.issues.map((issue: ZodIssue) => ({
        path: issue.path,
        message: issue.message,
      })),
    });
  }

  const slug = nanoid(8);
  const created = await db.playground.create({
    data: { slug, name: body.name ?? 'Untitled', config: result.data ?? {} },
  });
  return apiSuccess(created, 'Playground created successfully', 201);
});
