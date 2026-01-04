import { EmptyFileSystem, type LangiumCoreServices, type LangiumSharedCoreServices, inject, createDefaultCoreModule, createDefaultSharedCoreModule } from 'langium';
import { TripDSLGeneratedModule, TripDSLGeneratedSharedModule } from '@/langium/generated/module';

export type TripDslServices = LangiumCoreServices;

export function createTripDslServices(): {
  shared: LangiumSharedCoreServices;
  TripDsl: TripDslServices;
} {
  const shared = inject(
    createDefaultSharedCoreModule(EmptyFileSystem),
    TripDSLGeneratedSharedModule
  );

  const TripDsl = inject(
    createDefaultCoreModule({ shared }),
    TripDSLGeneratedModule
  );

  shared.ServiceRegistry.register(TripDsl);

  return { shared, TripDsl };
}
