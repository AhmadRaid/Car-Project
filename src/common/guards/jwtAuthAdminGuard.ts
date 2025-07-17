import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { I18nService } from 'nestjs-i18n';
import { TokenService } from '../token/token.service';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class JwtAuthAdminGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly tokenService: TokenService,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request.headers.authorization);

    //  await this.validateTokenNotBlacklisted(token);

    const decoded = this.verifyToken(token);

    const admin = await this.findAdminById(decoded._id);

    request.admin = admin;

    return true;
  }

  private extractTokenFromHeader(authorization?: string): string {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        this.i18n.t('عنوان التفويض مفقود أو غير صالح'),
      );
    }

    const token = authorization.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('عنوان التفويض غير موجود');
    }

    return token;
  }

  private verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('عنوان التفويض غير صحيح');
    }
  }

  private async findAdminById(userId: string): Promise<User> {
    const employee = await this.userModel.findOne({
      _id: userId,
      role: 'admin',
    });
    if (!employee) {
      throw new UnauthorizedException('ليس لديك صلاحية الدخول لهذه الصفحة');
    }
    return employee;
  }
}
