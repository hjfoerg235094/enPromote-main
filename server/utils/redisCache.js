
const redisClient = require('../config/redis');
const { logger } = require('./logger');

class RedisCache {
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值（会自动序列化为 JSON）
   * @param {number} expireSeconds - 过期时间（秒），默认为 3600 秒（1小时）
   */
  static async set(key, value, expireSeconds = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      if (expireSeconds > 0) {
        await redisClient.setEx(key, expireSeconds, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
      logger.debug(`缓存已设置: ${key}`);
      return true;
    } catch (error) {
      logger.error(`设置缓存失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存值（反序列化后的对象），如果不存在则返回 null
   */
  static async get(key) {
    try {
      const value = await redisClient.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      logger.error(`获取缓存失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {boolean} 是否删除成功
   */
  static async del(key) {
    try {
      await redisClient.del(key);
      logger.debug(`缓存已删除: ${key}`);
      return true;
    } catch (error) {
      logger.error(`删除缓存失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 批量删除缓存
   * @param {string[]} keys - 缓存键数组
   * @returns {boolean} 是否删除成功
   */
  static async delMultiple(keys) {
    try {
      await redisClient.del(keys);
      logger.debug(`批量缓存已删除: ${keys.join(', ')}`);
      return true;
    } catch (error) {
      logger.error(`批量删除缓存失败:`, error);
      return false;
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在
   */
  static async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`检查缓存是否存在失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 设置过期时间
   * @param {string} key - 缓存键
   * @param {number} expireSeconds - 过期时间（秒）
   * @returns {boolean} 是否设置成功
   */
  static async expire(key, expireSeconds) {
    try {
      await redisClient.expire(key, expireSeconds);
      logger.debug(`缓存过期时间已设置: ${key} (${expireSeconds}秒)`);
      return true;
    } catch (error) {
      logger.error(`设置缓存过期时间失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 获取缓存剩余过期时间（秒）
   * @param {string} key - 缓存键
   * @returns {number|null} 剩余秒数，如果不存在或没有设置过期时间则返回 -1
   */
  static async ttl(key) {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error(`获取缓存过期时间失败 [${key}]:`, error);
      return -1;
    }
  }

  /**
   * 原子性获取并删除缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存值，如果不存在则返回 null
   */
  static async getAndDel(key) {
    try {
      const value = await redisClient.get(key);
      if (value !== null) {
        await redisClient.del(key);
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error(`获取并删除缓存失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 缓存装饰器 - 用于包装需要缓存结果的异步函数
   * @param {string} keyPrefix - 缓存键前缀
   * @param {number} expireSeconds - 过期时间（秒）
   * @param {Function} keyGenerator - 自定义键生成函数（可选）
   * @returns {Function} 装饰器函数
   */
  static cache(keyPrefix, expireSeconds = 3600, keyGenerator = null) {
    return function (target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args) {
        // 生成缓存键
        let cacheKey;
        if (keyGenerator && typeof keyGenerator === 'function') {
          cacheKey = keyGenerator(...args);
        } else {
          cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
        }

        // 尝试从缓存获取
        const cachedValue = await RedisCache.get(cacheKey);
        if (cachedValue !== null) {
          logger.debug(`缓存命中: ${cacheKey}`);
          return cachedValue;
        }

        // 执行原函数
        const result = await originalMethod.apply(this, args);

        // 将结果存入缓存
        await RedisCache.set(cacheKey, result, expireSeconds);

        return result;
      };

      return descriptor;
    };
  }

  /**
   * 清除所有匹配模式的缓存
   * @param {string} pattern - 匹配模式，例如 "user:*"
   * @returns {number} 删除的键数量
   */
  static async clearPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await redisClient.del(keys);
      logger.info(`已清除 ${keys.length} 个匹配模式 "${pattern}" 的缓存`);
      return keys.length;
    } catch (error) {
      logger.error(`清除模式缓存失败 [${pattern}]:`, error);
      return 0;
    }
  }

  /**
   * 哈希表操作 - 设置字段
   * @param {string} key - 哈希表键
   * @param {string} field - 字段名
   * @param {any} value - 字段值
   * @param {number} expireSeconds - 过期时间（秒），可选
   */
  static async hSet(key, field, value, expireSeconds = null) {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.hSet(key, field, serializedValue);

      if (expireSeconds && expireSeconds > 0) {
        await redisClient.expire(key, expireSeconds);
      }

      logger.debug(`哈希字段已设置: ${key}.${field}`);
      return true;
    } catch (error) {
      logger.error(`设置哈希字段失败 [${key}.${field}]:`, error);
      return false;
    }
  }

  /**
   * 哈希表操作 - 获取字段
   * @param {string} key - 哈希表键
   * @param {string} field - 字段名
   * @returns {any|null} 字段值
   */
  static async hGet(key, field) {
    try {
      const value = await redisClient.hGet(key, field);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      logger.error(`获取哈希字段失败 [${key}.${field}]:`, error);
      return null;
    }
  }

  /**
   * 哈希表操作 - 获取所有字段
   * @param {string} key - 哈希表键
   * @returns {Object|null} 所有字段和值的对象
   */
  static async hGetAll(key) {
    try {
      const hash = await redisClient.hGetAll(key);
      if (Object.keys(hash).length === 0) {
        return null;
      }

      // 反序列化所有值
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }

      return result;
    } catch (error) {
      logger.error(`获取哈希表所有字段失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 哈希表操作 - 删除字段
   * @param {string} key - 哈希表键
   * @param {string} field - 字段名
   * @returns {boolean} 是否删除成功
   */
  static async hDel(key, field) {
    try {
      await redisClient.hDel(key, field);
      logger.debug(`哈希字段已删除: ${key}.${field}`);
      return true;
    } catch (error) {
      logger.error(`删除哈希字段失败 [${key}.${field}]:`, error);
      return false;
    }
  }

  /**
   * 列表操作 - 从左侧推入元素
   * @param {string} key - 列表键
   * @param {any[]} values - 要推入的值数组
   * @param {number} expireSeconds - 过期时间（秒），可选
   */
  static async lPush(key, values, expireSeconds = null) {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      await redisClient.lPush(key, serializedValues);

      if (expireSeconds && expireSeconds > 0) {
        await redisClient.expire(key, expireSeconds);
      }

      logger.debug(`列表左侧已推入 ${values.length} 个元素: ${key}`);
      return true;
    } catch (error) {
      logger.error(`列表左侧推入失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 列表操作 - 从右侧弹出元素
   * @param {string} key - 列表键
   * @returns {any|null} 弹出的元素
   */
  static async rPop(key) {
    try {
      const value = await redisClient.rPop(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      logger.error(`列表右侧弹出失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 列表操作 - 获取列表范围内的元素
   * @param {string} key - 列表键
   * @param {number} start - 起始索引
   * @param {number} stop - 结束索引
   * @returns {Array} 元素数组
   */
  static async lRange(key, start = 0, stop = -1) {
    try {
      const values = await redisClient.lRange(key, start, stop);
      return values.map(v => JSON.parse(v));
    } catch (error) {
      logger.error(`获取列表范围失败 [${key}]:`, error);
      return [];
    }
  }

  /**
   * 有序集合操作 - 添加成员
   * @param {string} key - 有序集合键
   * @param {Array<{score: number, value: any}>} members - 成员数组
   * @param {number} expireSeconds - 过期时间（秒），可选
   */
  static async zAdd(key, members, expireSeconds = null) {
    try {
      const memberEntries = members.map(m => ({
        score: m.score,
        value: JSON.stringify(m.value)
      }));

      await redisClient.zAdd(key, memberEntries);

      if (expireSeconds && expireSeconds > 0) {
        await redisClient.expire(key, expireSeconds);
      }

      logger.debug(`有序集合已添加 ${members.length} 个成员: ${key}`);
      return true;
    } catch (error) {
      logger.error(`有序集合添加成员失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 有序集合操作 - 获取排名范围内的成员
   * @param {string} key - 有序集合键
   * @param {number} start - 起始排名
   * @param {number} stop - 结束排名
   * @param {boolean} reverse - 是否倒序，默认 false
   * @returns {Array<{value: any, score: number}>} 成员数组
   */
  static async zRange(key, start = 0, stop = -1, reverse = false) {
    try {
      const members = await redisClient.zRange(key, start, stop, {
        REV: reverse
      });

      return members.map(m => ({
        value: JSON.parse(m.value),
        score: m.score
      }));
    } catch (error) {
      logger.error(`获取有序集合范围失败 [${key}]:`, error);
      return [];
    }
  }

  /**
   * 有序集合操作 - 获取成员的排名
   * @param {string} key - 有序集合键
   * @param {any} value - 成员值
   * @param {boolean} reverse - 是否倒序，默认 false
   * @returns {number|null} 排名，如果不存在则返回 null
   */
  static async zRank(key, value, reverse = false) {
    try {
      const serializedValue = JSON.stringify(value);
      const rank = await redisClient.zRank(key, serializedValue, {
        REV: reverse
      });

      return rank;
    } catch (error) {
      logger.error(`获取有序集合成员排名失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 有序集合操作 - 移除成员
   * @param {string} key - 有序集合键
   * @param {any} value - 成员值
   * @returns {boolean} 是否移除成功
   */
  static async zRem(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.zRem(key, serializedValue);
      logger.debug(`有序集合成员已移除: ${key}`);
      return true;
    } catch (error) {
      logger.error(`移除有序集合成员失败 [${key}]:`, error);
      return false;
    }
  }
}

module.exports = RedisCache;
