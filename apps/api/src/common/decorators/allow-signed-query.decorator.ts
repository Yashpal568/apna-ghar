import { SetMetadata } from '@nestjs/common';

export const ALLOW_SIGNED_QUERY_KEY = 'allow_signed_query';
export const AllowSignedQuery = () => SetMetadata(ALLOW_SIGNED_QUERY_KEY, true);
