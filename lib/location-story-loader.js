const fs = require('fs');
const path = require('path');

const SOUL_TYPE_INTERESTS = {
  artistic_youth: ['诗词歌赋', '小众景点', '文艺小店', '古镇古村', '艺术展览'],
  business_elite: ['城市地标', '商务出行', '高效实用', '协议酒店', '会议中心'],
  foodie: ['地道美食', '街头小吃', '网红餐厅', '美食探店', '地方特产'],
  history_buff: ['历史典故', '博物馆', '古迹遗址', '文物鉴赏', '古代建筑'],
  photography_lover: ['风景摄影', '最佳机位', '日出日落', '建筑摄影', '构图技巧']
};

class LocationStoryLoader {
  constructor(config = {}) {
    this.dataPath = config.dataPath || path.join(__dirname, '../data/location-stories.json');
    this.cacheEnabled = config.cacheEnabled !== false;
    this.cache = null;
    this.lastLoadTime = null;
  }

  async load() {
    if (this.cacheEnabled && this.cache) {
      return this.cache;
    }

    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const stories = JSON.parse(data);
      
      this.cache = stories;
      this.lastLoadTime = new Date();
      
      return stories;
    } catch (error) {
      console.error('加载地点故事库失败:', error);
      return null;
    }
  }

  async getAllCities() {
    const data = await this.load();
    if (!data) return [];
    
    return data.cities.map(city => ({
      name: city.name,
      coordinates: city.coordinates,
      description: city.description,
      locationCount: city.locations ? city.locations.length : 0
    }));
  }

  async getCity(cityName) {
    const data = await this.load();
    if (!data) return null;
    
    return data.cities.find(
      city => city.name === cityName || city.name.includes(cityName)
    ) || null;
  }

  async getLocation(cityName, locationId) {
    const city = await this.getCity(cityName);
    if (!city || !city.locations) return null;
    
    return city.locations.find(
      loc => loc.id === locationId || loc.name === locationName
    ) || null;
  }

  async getLocationById(locationId) {
    const data = await this.load();
    if (!data) return null;
    
    for (const city of data.cities) {
      if (city.locations) {
        const location = city.locations.find(loc => loc.id === locationId);
        if (location) {
          return {
            ...location,
            cityName: city.name
          };
        }
      }
    }
    
    return null;
  }

  async getLocationByName(locationName) {
    const data = await this.load();
    if (!data) return null;
    
    for (const city of data.cities) {
      if (city.locations) {
        const location = city.locations.find(
          loc => loc.name === locationName || loc.name.includes(locationName)
        );
        if (location) {
          return {
            ...location,
            cityName: city.name
          };
        }
      }
    }
    
    return null;
  }

  async getLocationsByCity(cityName) {
    const city = await this.getCity(cityName);
    if (!city || !city.locations) return [];
    
    return city.locations.map(loc => ({
      ...loc,
      cityName: city.name
    }));
  }

  async filterBySoulType(soulType, locations) {
    if (!locations || locations.length === 0) return [];
    if (!soulType) return locations;
    
    const relevantInterests = SOUL_TYPE_INTERESTS[soulType] || [];
    if (relevantInterests.length === 0) return locations;
    
    const scoredLocations = locations.map(location => {
      let score = 0;
      const locationTags = location.tags || [];
      
      for (const interest of relevantInterests) {
        if (locationTags.some(tag => tag.includes(interest) || interest.includes(tag))) {
          score += 1;
        }
        if (location.description && location.description.includes(interest)) {
          score += 0.5;
        }
      }
      
      if (location.type === 'cultural' && soulType === 'history_buff') score += 2;
      if (location.type === 'food' && soulType === 'foodie') score += 2;
      if (location.type === 'art' && soulType === 'artistic_youth') score += 2;
      if (location.type === 'wonder' || location.type === 'landscape') {
        if (soulType === 'photography_lover') score += 2;
        if (soulType === 'artistic_youth') score += 1;
      }
      
      return { location, score };
    });
    
    scoredLocations.sort((a, b) => b.score - a.score);
    
    return scoredLocations.map(item => item.location);
  }

  async getStoriesForSoulType(soulType, cityName = null) {
    let locations;
    
    if (cityName) {
      locations = await this.getLocationsByCity(cityName);
    } else {
      const cities = await this.getAllCities();
      locations = [];
      for (const city of cities) {
        const cityLocations = await this.getLocationsByCity(city.name);
        locations.push(...cityLocations);
      }
    }
    
    return this.filterBySoulType(soulType, locations);
  }

  async getRandomLocation(cityName = null) {
    let locations;
    
    if (cityName) {
      locations = await this.getLocationsByCity(cityName);
    } else {
      const cities = await this.getAllCities();
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      locations = await this.getLocationsByCity(randomCity.name);
    }
    
    if (locations.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * locations.length);
    return locations[randomIndex];
  }

  async getStoryMaterials(locationId) {
    const location = await this.getLocationById(locationId);
    if (!location) return null;
    
    return {
      location: {
        id: location.id,
        name: location.name,
        cityName: location.cityName,
        type: location.type,
        tags: location.tags
      },
      basicInfo: location.basicInfo,
      historyLegend: location.historyLegend,
      poetry: location.poetry,
      foodStories: location.foodStories,
      folkCustoms: location.folkCustoms,
      photography: location.photography
    };
  }

  async searchLocations(keyword) {
    const data = await this.load();
    if (!data) return [];
    
    const results = [];
    const lowerKeyword = keyword.toLowerCase();
    
    for (const city of data.cities) {
      if (city.locations) {
        for (const location of city.locations) {
          const matches = 
            location.name.toLowerCase().includes(lowerKeyword) ||
            location.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
            (location.basicInfo && JSON.stringify(location.basicInfo).toLowerCase().includes(lowerKeyword));
          
          if (matches) {
            results.push({
              ...location,
              cityName: city.name
            });
          }
        }
      }
    }
    
    return results;
  }

  clearCache() {
    this.cache = null;
    this.lastLoadTime = null;
  }

  reload() {
    this.clearCache();
    return this.load();
  }

  getStats() {
    return {
      cacheEnabled: this.cacheEnabled,
      cacheLoaded: this.cache !== null,
      lastLoadTime: this.lastLoadTime,
      dataPath: this.dataPath
    };
  }
}

module.exports = {
  LocationStoryLoader,
  SOUL_TYPE_INTERESTS
};
