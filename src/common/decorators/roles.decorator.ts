import { SetMetadata } from '@nestjs/common';
import { userRoles } from '../enum/userRoles.enum';

export const Role = (...roles: userRoles[]) => SetMetadata('roles', roles);
