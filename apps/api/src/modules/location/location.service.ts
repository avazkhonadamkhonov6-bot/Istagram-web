import { Injectable } from '@nestjs/common';
import { Location, Prisma } from '@prisma/client';
import { AddLocationDto, ErrorCode, LocationDto, PaginationQuery, UpdateLocationDto } from '@repo/shared';
import { notFound } from '../../common/app-exception';
import { skipTake } from '../../common/response';
import { PrismaService } from '../../infra/prisma.service';

const toDto = (l: Location): LocationDto => ({ locationId: l.id, city: l.city, state: l.state, zipCode: l.zipCode, country: l.country });
const like = (v?: string) => (v ? { contains: v, mode: 'insensitive' as const } : undefined);

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: PaginationQuery & { City?: string; State?: string; ZipCode?: string; Country?: string }) {
    const where: Prisma.LocationWhereInput = { city: like(q.City), state: like(q.State), zipCode: like(q.ZipCode), country: like(q.Country) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.location.findMany({ where, orderBy: { id: 'asc' }, ...skipTake(q) }),
      this.prisma.location.count({ where }),
    ]);
    return { items: rows.map(toDto), total };
  }

  async getById(id: number) {
    const l = await this.prisma.location.findUnique({ where: { id } });
    if (!l) throw notFound(ErrorCode.LOCATION_NOT_FOUND);
    return toDto(l);
  }

  async add(dto: AddLocationDto) {
    return toDto(await this.prisma.location.create({ data: dto }));
  }

  async update({ locationId, ...data }: UpdateLocationDto) {
    await this.getById(locationId);
    return toDto(await this.prisma.location.update({ where: { id: locationId }, data }));
  }

  async remove(id: number) {
    const { count } = await this.prisma.location.deleteMany({ where: { id } });
    if (count === 0) throw notFound(ErrorCode.LOCATION_NOT_FOUND);
    return true;
  }
}
