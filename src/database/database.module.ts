import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        autoLoadEntities: true,
        synchronize: false,
        retryAttempts: 1,
        poolSize: 10,
        extra: {
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          query_timeout: 10000,
        },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
