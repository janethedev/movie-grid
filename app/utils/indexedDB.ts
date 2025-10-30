import { isBrowser, DB_CONFIG } from "../constants";
import { GameCell } from "../types";

/**
 * 初始化IndexedDB
 */
export async function initDB() {
  if (!isBrowser) return null;

  // 检查浏览器是否支持 IndexedDB
  if (!window.indexedDB) {
    console.error("您的浏览器不支持IndexedDB，无法保存数据");
    return null;
  }

  return new Promise<IDBDatabase | null>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event);
        resolve(null);
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
          db.createObjectStore(DB_CONFIG.storeName, { keyPath: "id" });
        }
      };
    } catch (error) {
      console.error("初始化IndexedDB失败:", error);
      resolve(null);
    }
  });
}

/**
 * 保存单元格数据到IndexedDB
 */
export async function saveToIndexedDB(cell: GameCell) {
  if (!isBrowser) return;

  try {
    const db = await initDB();
    if (!db) return;

    const transaction = db.transaction(DB_CONFIG.storeName, "readwrite");
    const store = transaction.objectStore(DB_CONFIG.storeName);

    // 只保存必要的数据，不保存imageObj
    const { imageObj, ...cellData } = cell;
    store.put(cellData);

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log("数据保存成功");
        resolve();
      };

      transaction.onerror = (error) => {
        console.error("保存数据失败:", error);
        reject(error);
      };
    });
  } catch (error) {
    console.error("保存数据失败:", error);
  }
}

/**
 * 从IndexedDB加载所有单元格数据
 */
export async function loadCellsFromDB() {
  try {
    const db = await initDB();
    if (!db) return [];

    const transaction = db.transaction(DB_CONFIG.storeName, "readonly");
    const store = transaction.objectStore(DB_CONFIG.storeName);

    return new Promise<GameCell[]>((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        console.error("加载数据失败:", event);
        reject([]);
      };
    });
  } catch (error) {
    console.error("加载数据失败:", error);
    return [];
  }
}
