/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { ConfigService } from '@nestjs/config';
import { Cluster } from 'ioredis';

let cluster: Cluster;

export function createRedisCluster(configService: ConfigService): Cluster {
  if (cluster) return cluster;

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

  console.log('Redis clusters:', clusterNodes);

  cluster = new Cluster(clusterNodes, {
    // enableReadyCheck: false,
    // scaleReads: 'master',
    redisOptions: {
      username: clusterUsername,
      password: clusterPassword,
    },
  });

  cluster.on('error', (err) => {
    console.error('[RedisCluster]', err);
  });

  return cluster;
}
