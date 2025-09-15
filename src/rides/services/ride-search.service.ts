import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Ride } from '../entities/rides.entity';

@Injectable()
export class RideSearchService {
  constructor(
    @InjectRepository(Ride)
    private readonly rideRepo: Repository<Ride>,
  ) {}

  /**
   * Search for rides within `radius` meters of user location.
   * Considers startPoint, endPoint, and route.
   */
  async searchNearbyRides(lat: number, lng: number, radius = 10000) {
    const point = `SRID=4326;POINT(${lng} ${lat})`;

    return this.rideRepo
      .createQueryBuilder('ride')
      .addSelect(
        `
        LEAST(
          ST_Distance(ride.startPoint::geography, ST_GeogFromText(:point)),
          ST_Distance(ride.endPoint::geography, ST_GeogFromText(:point)),
          COALESCE(ST_Distance(ride.route::geography, ST_GeogFromText(:point)), 1000000)
        )`,
        'distance',
      )
      .where(
        `
        ST_DWithin(ride.startPoint::geography, ST_GeogFromText(:point), :radius)
        OR ST_DWithin(ride.endPoint::geography, ST_GeogFromText(:point), :radius)
        OR (ride.route IS NOT NULL AND ST_DWithin(ride.route::geography, ST_GeogFromText(:point), :radius))
      `,
      )
      .setParameters({ point, radius })
      .orderBy('distance', 'ASC')
      .getMany();
  }
}
