import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';
import { userRoles } from 'src/common/enum/userRoles.enum';
import { Role } from 'src/common/decorators/roles.decorator';
import { CreateReportDto } from './dto/report.dto';
import { AuthRequest } from 'src/interfaces/AuthRequest';
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}
  @Post()
  @Role(userRoles.EMPLOYEE)
  async create(
    @Body() createReportDto: CreateReportDto,
    @Req() req: AuthRequest,
  ) {
    const employeeId = req.user._id;
    return this.reportsService.create(createReportDto, employeeId);
  }

  @Get()
  @Role(userRoles.ADMIN)
  async findAll() {
    return this.reportsService.findAll();
  }

  //   @Get(':id')
  //   @Role(userRoles.ADMIN)
  //   async findOne(@Param('id') id: string, @Req() req: AuthRequest) {
  //     return this.reportsService.findOne(id, req.user._id);
  //   }

  //   @Patch(':id/status')
  //   @UseGuards(JwtAuthGuard, RolesGuard)
  //   @Roles(userRoles.ADMIN)
  //   async updateStatus(
  //     @Param('id') id: string,
  //     @Body('status') status: 'reviewed' | 'resolved',
  //   ) {
  //     return this.reportsService.updateStatus(id, status);
  //   }

  //   @Delete(':id')
  //   @Role(userRoles.ADMIN, userRoles.EMPLOYEE)
  //   async remove(@Param('reportId') reportId: string, @Req() req: AuthRequest) {
  //     return this.reportsService.remove(reportId, req.user);
  //   }
}
