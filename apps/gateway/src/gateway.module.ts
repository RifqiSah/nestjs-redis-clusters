import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import * as redisStore from 'cache-manager-ioredis';

import redisConfig from 'apps/config/redis.config';
import { createRedisCluster } from 'apps/utils/redis/redis-cluster.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const clusterConfig: string =
          configService.get<string>('redis.clusters.nodes') ?? '';
        const clusterUsername: string =
          configService.get<string>('redis.clusters.username') ?? '';
        const clusterPassword: string =
          configService.get<string>('redis.clusters.password') ?? '';

        let clusterNodes: any = [];
        if (clusterConfig.length) {
          try {
            clusterNodes = clusterConfig.split(',').map((n) => {
              const node = n.split(':');
              return {
                host: node[0],
                port: Number(node[1]),
              };
            });
          } catch (err) {
            console.error('Error parsing redis cluster configuration!', err);
          }
        }

        return {
          store: redisStore,
          clusterConfig: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            nodes: clusterNodes,
            options: {
              // enableReadyCheck: false,
              // scaleReads: 'master',
              redisOptions: {
                username: clusterUsername,
                password: clusterPassword,
              },
            },
          },
          ttl: 24 * 60 * 60, // 1 day
          isGlobal: true,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: createRedisCluster(configService),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'data-master-queue',
    }),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
