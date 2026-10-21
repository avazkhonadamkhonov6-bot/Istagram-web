import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AddLocationDto,
  UpdateLocationDto,
  addLocationSchema,
  getLocationsQuerySchema,
  intIdQuerySchema,
  updateLocationSchema,
} from '@repo/shared';
import type { z } from 'zod';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok, paged } from '../../common/response';
import { LocationService } from './location.service';

@ApiTags('Location')
@Controller('Location')
export class LocationController {
  constructor(private readonly locations: LocationService) {}

  @Get('get-Locations')
  async list(@Query(new ZodPipe(getLocationsQuerySchema)) q: z.infer<typeof getLocationsQuerySchema>) {
    const { items, total } = await this.locations.list(q);
    return paged(items, total, q);
  }

  @Get('get-Location-by-id')
  async getById(@Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.locations.getById(q.id));
  }

  @Post('add-Location')
  async add(@Body(new ZodPipe(addLocationSchema)) dto: AddLocationDto) {
    return ok(await this.locations.add(dto));
  }

  @Put('update-Location')
  async update(@Body(new ZodPipe(updateLocationSchema)) dto: UpdateLocationDto) {
    return ok(await this.locations.update(dto));
  }

  @Delete('delete-Location')
  async remove(@Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.locations.remove(q.id));
  }
}
