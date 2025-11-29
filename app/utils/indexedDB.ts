import { isBrowser, DB_CONFIG } from "../constants";
import { MovieCell } from "../types";

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

  return new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      // 添加超时机制，防止在 Safari 隐私模式下永久挂起
      const timeoutId = setTimeout(() => {
        console.warn("IndexedDB 初始化超时（可能是隐私模式）");
        resolve(null);
      }, 1000);

      request.onerror = (event) => {
        clearTimeout(timeoutId);
        console.error("IndexedDB error:", event);
        resolve(null);
      };

      request.onsuccess = (event) => {
        clearTimeout(timeoutId);
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
          db.createObjectStore(DB_CONFIG.storeName, { keyPath: "id" });
        }
      };

      // Safari 在隐私模式下可能会阻塞而不触发任何事件
      request.onblocked = () => {
        clearTimeout(timeoutId);
        console.warn("IndexedDB 被阻止");
        resolve(null);
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
export async function saveToIndexedDB(cell: MovieCell) {
  if (!isBrowser) return;

  try {
    const db = await initDB();
    if (!db) return;

    const transaction = db.transaction(DB_CONFIG.storeName, "readwrite");
    const store = transaction.objectStore(DB_CONFIG.storeName);

    // 只保存必要的数据，不保存imageObj
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageObj: _imageObj, ...cellData } = cell;
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
 * 从 IndexedDB加载所有单元格数据
 */
export async function loadCellsFromDB(): Promise<MovieCell[]> {
  try {
    const db = await initDB();
    if (!db) return [];

    const transaction = db.transaction(DB_CONFIG.storeName, "readonly");
    const store = transaction.objectStore(DB_CONFIG.storeName);

    return new Promise<MovieCell[]>((resolve) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        console.error("加载数据失败:", event);
        resolve([]);
      };
    });
  } catch (error) {
    console.error("加载数据失败:", error);
    return [];
  }
}
