import { Playground } from 'db/client';
import { ZodIssue } from 'zod';
import db from 'app/lib/db';
import { withApiErrorHandling } from 'app/utils/with-error-handling';
import { PlaygroundConfigSchema } from 'app/sections/playground/schema';
import { apiSuccess, ValidationError, NotFoundError } from 'app/utils/response';

export const GET = withApiErrorHandling<Playground, { slug: string }>(
  async (req: Request, { params }) => {
    const { slug } = await params;
    const item = await db.playground.findUnique({ where: { slug } });
    if (!item) {
      throw new NotFoundError('Playground');
    }
    return apiSuccess(item, 'Playground retrieved successfully');
  }
);

export const PATCH = withApiErrorHandling<Playground, { slug: string }>(
  async (req: Request, { params }) => {
    const { slug } = await params;
    const body = await req.json();

    // Validate config against PlaygroundConfigSchema
    if (body.config) {
      const result = PlaygroundConfigSchema.safeParse(body.config);
      if (!result.success) {
        throw new ValidationError('Invalid playground configuration', {
          issues: result.error.issues.map((issue: ZodIssue) => ({
            path: issue.path,
            message: issue.message,
          })),
        });
      }
      body.config = result.data; // Use validated config
    }

    const updated = await db.playground.update({
      where: { slug },
      data: { config: body.config ?? undefined, name: body.name ?? undefined },
    });
    return apiSuccess(updated, 'Playground updated successfully');
  }
);
