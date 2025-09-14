import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string; // ref to users.id

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  startLocation: string; // 'POINT(lng lat)'

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  endLocation: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'LineString',
    srid: 4326,
    nullable: true,
  })
  route?: string; // LINESTRING(lng lat, ...)

  @Column({ type: 'timestamptz' })
  startTime: Date;
}
