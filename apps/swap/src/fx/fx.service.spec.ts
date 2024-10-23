import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { FxService } from './fx.service';

describe('FxService Mocked', () => {
  let mockFxService: FxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        HttpModule,
        CacheModule.register()
      ],
      providers: [
        ConfigService,
        {
          provide: FxService,
          useValue: {
            getKesToBtcRate: jest.fn(() => {
              return 11.4221;
            }),
          },
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    mockFxService = module.get<FxService>(FxService);
  });

  it('should be defined', () => {
    expect(mockFxService).toBeDefined();
  });

  it('should return a rate', async () => {
    const rate = await mockFxService.getKesToBtcRate();

    expect(rate).toBeDefined();
  });
});

describe('FxService Real', () => {
  let fxService: FxService;
  let mockCfg: { get: jest.Mock };
  let mockCacheManager: any;
  const mock_rate = 11.483007291;

  beforeEach(async () => {
    mockCfg = {
      get: jest.fn(),
    };

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        HttpModule,
        CacheModule.register()
      ],
      providers: [
        {
          provide: ConfigService,
          useValue: mockCfg,
        },
        FxService,
        {
          provide: 'CACHE_MANAGER',
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    fxService = module.get<FxService>(FxService);
  });

  it('should be defined', () => {
    expect(fxService).toBeDefined();
  });

  it('dev: should use MOCK_KES_BTC_RATE config', async () => {
    (mockCfg.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return 'dev';
        case 'MOCK_KES_BTC_RATE':
          return mock_rate;
        default:
          return undefined;
      }
    });

    await expect(await fxService.getKesToBtcRate()).toEqual((1 / mock_rate) * 100000000);
  });

  it('test: should use MOCK_KES_BTC_RATE config', async () => {
    (mockCfg.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return 'dev';
        case 'MOCK_KES_BTC_RATE':
          return mock_rate;
        default:
          return undefined;
      }
    });

    await expect(await fxService.getKesToBtcRate()).toEqual((1 / mock_rate) * 100000000);
  });

  it('production: should ignore MOCK_KES_BTC_RATE config', async () => {
    (mockCfg.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return 'production';
        case 'MOCK_KES_BTC_RATE':
          return '1000000';
        default:
          return undefined;
      }
    });

    await expect(fxService.getKesToBtcRate()).rejects.toThrow('CURRENCY_API_KEY not found');
  });

  it('production: should throw a 401 error when CURRENCY_API_KEY config is not valid', async () => {
    (mockCfg.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return 'production';
        case 'CURRENCY_API_KEY':
          return 'test-api-key';
        case 'MOCK_KES_BTC_RATE':
          return '1000000';
        default:
          return undefined;
      }
    });

    await expect(fxService.getKesToBtcRate()).rejects.toThrow('Request failed with status code 401');
  });
});