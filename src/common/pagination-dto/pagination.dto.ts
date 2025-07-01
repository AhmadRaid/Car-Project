export class PaginationDto {
  limit: number = 10;
  offset: number = 0;
    sort?: {
    order: 'asc' | 'desc';
    key: string;
  };
}