import { STORE_NAMES } from '@/core/storage/database';
import { IndexedDBRepository } from '@/core/storage/indexeddb-repository';
import type { LinkAsset } from '@/core/types/project';

export class IndexedDBLinkAssetRepository extends IndexedDBRepository<LinkAsset> {
  constructor() {
    super(STORE_NAMES.linkAssets, (asset) => asset.id);
  }

  async listByProject(projectId: string): Promise<LinkAsset[]> {
    const all = await this.list();
    return all.filter((asset) => asset.projectId === projectId);
  }

  async getDefaultForProject(projectId: string): Promise<LinkAsset | null> {
    const assets = await this.listByProject(projectId);
    return assets[0] ?? null;
  }
}

export function createIndexedDBLinkAssetRepository() {
  return new IndexedDBLinkAssetRepository();
}
