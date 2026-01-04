import { EmptyFileSystem, type LangiumCoreServices, type LangiumSharedCoreServices, inject, createDefaultModule, createDefaultSharedModule } from 'langium';
import { TripDSLGeneratedModule, TripDSLGeneratedSharedModule } from '@/langium/generated/module';

export type TripDslServices = LangiumCoreServices;

export function createTripDslServices(): {
  shared: LangiumSharedCoreServices;
  TripDsl: TripDslServices;
} {
  const shared = inject(
    createDefaultSharedModule(EmptyFileSystem),
    TripDSLGeneratedSharedModule
  );

  const TripDsl = inject(
    createDefaultModule({ shared }),
    TripDSLGeneratedModule
  );

  shared.ServiceRegistry.register(TripDsl);

  return { shared, TripDsl };
}
