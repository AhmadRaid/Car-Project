import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import { CreateReportDto } from './dto/report.dto';
import { ReportDocument, Reports } from 'src/schemas/reports.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Reports.name) private reportModel: Model<Reports>,
    @InjectModel('User') private userModel: Model<User>,
  ) {}

  async create(createReportDto: CreateReportDto, employeeId: string) {
    // Verify employee exists
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employee = await this.userModel.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      throw new NotFoundException('Employee not found');
    }

    const report = await this.reportModel.create({
      ...createReportDto,
      employeeId
    });

    return report;
  }

  async findAll() {
    return await this.reportModel.find({ isDeleted: false });
  }

  async findOne(reportId: string, user?: UserDocument) {
    const report = await this.reportModel.findOne({
      _id: reportId,
      isDeleted: false,
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Only allow access if user is admin or the report owner
    if (
      user &&
      user.role !== 'admin' &&
      report.employeeId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('Not authorized to view this report');
    }

    return report;
  }

  async updateStatus(id: string, status: 'reviewed' | 'resolved') {
    const report = await this.reportModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async remove(id: string, user: UserDocument): Promise<{ message: string }> {
    const report = await this.reportModel.findById(id);

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Only allow deletion by admin or the report owner
    if (
      user.role !== 'admin' &&
      report.employeeId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('Not authorized to delete this report');
    }

    await this.reportModel.findByIdAndUpdate(id, { isDeleted: true });
    return { message: 'Report deleted successfully' };
  }
}
