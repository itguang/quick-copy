/*
preload.js 说明
- 运行于 Electron 预加载环境（preload），可使用：Node.js API、Electron 渲染进程 API、Web API、第三方 Node.js 库。
- 在此编写 Node.js / Electron 相关逻辑。
- 通过 window.services 向前端 UI 暴露封装后的服务接口。

约束：
- 禁止将 Node.js 原生模块（如 fs、child_process、require 等）直接暴露给前端。
- 仅允许暴露函数形式的受控能力。
*/

const fs = require('fs');

const STORAGE_KEY = 'string_list';

/**
 * 获取所有字符串列表
 */
function getAllStrings() {
  try {
    const data = window.utools.dbStorage.getItem(STORAGE_KEY);
    return data || [];
  } catch (e) {
    console.error('获取字符串列表失败:', e);
    return [];
  }
}

/**
 * 保存字符串列表
 */
function saveStrings(list) {
  try {
    window.utools.dbStorage.setItem(STORAGE_KEY, list);
    return true;
  } catch (e) {
    console.error('保存字符串列表失败:', e);
    return false;
  }
}

/**
 * 添加字符串（追加模式）
 */
function addString(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;

  const list = getAllStrings();
  // 避免重复
  if (!list.includes(trimmed)) {
    list.push(trimmed);
    return saveStrings(list);
  }
  return false;
}

/**
 * 批量添加字符串（导入时使用）
 */
function addStrings(arr) {
  if (!Array.isArray(arr)) return 0;
  const list = getAllStrings();
  let addedCount = 0;

  for (const str of arr) {
    if (str && typeof str === 'string') {
      const trimmed = str.trim();
      if (trimmed && !list.includes(trimmed)) {
        list.push(trimmed);
        addedCount++;
      }
    }
  }

  if (addedCount > 0) {
    saveStrings(list);
  }
  return addedCount;
}

/**
 * 删除字符串
 */
function removeString(str) {
  if (!str) return false;
  const list = getAllStrings();
  const index = list.indexOf(str);
  if (index > -1) {
    list.splice(index, 1);
    return saveStrings(list);
  }
  return false;
}

/**
 * 搜索字符串（模糊匹配）
 */
function searchStrings(keyword) {
  if (!keyword || typeof keyword !== 'string') {
    return getAllStrings();
  }
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) {
    return getAllStrings();
  }

  const list = getAllStrings();
  return list.filter(item => item.toLowerCase().includes(trimmed));
}

/**
 * 导出所有字符串为 JSON 数组
 */
function exportStrings() {
  return JSON.stringify(getAllStrings(), null, 2);
}

/**
 * 导入 JSON 数组字符串
 */
function importStrings(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) {
      return { success: false, message: 'JSON 格式错误，需要数组类型' };
    }
    const count = addStrings(data);
    return { success: true, count };
  } catch (e) {
    return { success: false, message: 'JSON 解析失败: ' + e.message };
  }
}

/**
 * 从文件导入 JSON
 */
function importFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return importStrings(content);
  } catch (e) {
    return { success: false, message: '读取文件失败: ' + e.message };
  }
}

window.services = {
  getAllStrings,
  addString,
  addStrings,
  removeString,
  searchStrings,
  exportStrings,
  importStrings,
  importFromFile
};
