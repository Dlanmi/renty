import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDuplicatedListingRecord,
  buildDuplicatedPhotoStoragePath,
  duplicateListingPhotoRows,
  filterExclusiveStoragePathsFromRows,
  selectDuplicatedCoverUrl,
} from "@/lib/admin/listings";

const LISTING_A = "aaaa-aaaa-aaaa";
const LISTING_B = "bbbb-bbbb-bbbb";
const PATH_1 = "aaaa-aaaa-aaaa/1700000000-0.jpg";
const PATH_2 = "aaaa-aaaa-aaaa/1700000000-1.jpg";

test("filterExclusiveStoragePathsFromRows excluye paths compartidos con otros listings", () => {
  const result = filterExclusiveStoragePathsFromRows(
    [PATH_1, PATH_2],
    LISTING_A,
    [
      { listing_id: LISTING_A, storage_path: PATH_1 },
      { listing_id: LISTING_A, storage_path: PATH_2 },
      { listing_id: LISTING_B, storage_path: PATH_1 },
    ]
  );

  assert.deepEqual(result, [PATH_2]);
});

test("buildDuplicatedListingRecord reinicia estado y timestamps públicos al duplicar", () => {
  const duplicated = buildDuplicatedListingRecord(
    {
      id: LISTING_A,
      title: "Apartamento acogedor",
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-10T00:00:00.000Z",
      published_at: "2026-01-02T00:00:00.000Z",
      rented_at: null,
      neighborhood: "Verbenal",
    },
    LISTING_B,
    "2026-03-28T12:00:00.000Z"
  );

  assert.equal(duplicated.id, LISTING_B);
  assert.equal(duplicated.title, "Apartamento acogedor (copia)");
  assert.equal(duplicated.status, "draft");
  assert.equal(duplicated.published_at, null);
  assert.equal(duplicated.rented_at, null);
  assert.equal(duplicated.created_at, "2026-03-28T12:00:00.000Z");
  assert.equal(duplicated.updated_at, "2026-03-28T12:00:00.000Z");
});

test("buildDuplicatedPhotoStoragePath conserva extensión y mueve la foto al folder del nuevo listing", () => {
  assert.equal(
    buildDuplicatedPhotoStoragePath(LISTING_B, 2, PATH_1, 1_700_000_123),
    "bbbb-bbbb-bbbb/1700000123-2.jpg"
  );
});

test("duplicateListingPhotoRows copia físicamente fotos de storage y conserva URLs externas", async () => {
  const downloadedPaths: string[] = [];
  const uploadedPaths: string[] = [];

  const rows = await duplicateListingPhotoRows(
    [
      {
        storage_path: PATH_1,
        public_url: `https://storage.example.com/${PATH_1}`,
        caption: "Sala",
        room_type: "living_room",
        sort_order: 0,
        is_cover: true,
      },
      {
        storage_path: "",
        public_url: "https://images.example.com/external.jpg",
        caption: "Fachada",
        room_type: "facade",
        sort_order: 1,
        is_cover: false,
      },
    ],
    LISTING_B,
    {
      now: () => 1_700_000_123,
      async download(storagePath) {
        downloadedPaths.push(storagePath);
        return {
          bytes: Buffer.from([1, 2, 3]),
          contentType: "image/jpeg",
        };
      },
      async upload(storagePath) {
        uploadedPaths.push(storagePath);
        return true;
      },
      getPublicUrl(storagePath) {
        return `https://storage.example.com/${storagePath}`;
      },
    }
  );

  assert.deepEqual(downloadedPaths, [PATH_1]);
  assert.deepEqual(uploadedPaths, ["bbbb-bbbb-bbbb/1700000123-0.jpg"]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.listing_id, LISTING_B);
  assert.equal(rows[0]?.storage_path, "bbbb-bbbb-bbbb/1700000123-0.jpg");
  assert.equal(
    rows[0]?.public_url,
    "https://storage.example.com/bbbb-bbbb-bbbb/1700000123-0.jpg"
  );
  assert.equal(rows[1]?.storage_path, "");
  assert.equal(rows[1]?.public_url, "https://images.example.com/external.jpg");
  assert.equal(selectDuplicatedCoverUrl(rows), rows[0]?.public_url);
});

test("duplicateListingPhotoRows hace fallback a URL existente cuando falla la copia física", async () => {
  const rows = await duplicateListingPhotoRows(
    [
      {
        storage_path: PATH_1,
        public_url: `https://storage.example.com/${PATH_1}`,
        caption: null,
        room_type: null,
        sort_order: 0,
        is_cover: true,
      },
    ],
    LISTING_B,
    {
      now: () => 1_700_000_123,
      async download() {
        return null;
      },
      async upload() {
        return true;
      },
      getPublicUrl(storagePath) {
        return `https://storage.example.com/${storagePath}`;
      },
    }
  );

  assert.deepEqual(rows, [
    {
      listing_id: LISTING_B,
      storage_path: "",
      public_url: `https://storage.example.com/${PATH_1}`,
      caption: null,
      room_type: null,
      sort_order: 0,
      is_cover: true,
    },
  ]);
});
