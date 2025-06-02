import { SetMetadata } from '@nestjs/common';
import { Roles } from '../enum/adminRole.enum';

export const Role = (...roles: Roles[]) => SetMetadata('roles', roles);
