/**
 * API Endpoints configuration
 * Use these constants instead of hardcoding URLs
 */

const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  RIDES: {
    LIST: '/rides',
    CREATE: '/rides',
    GET_DETAIL: (id) => `/rides/${id}`,
    UPDATE: (id) => `/rides/${id}`,
    DELETE: (id) => `/rides/${id}`,
  },
  BOOKINGS: {
    LIST: '/bookings',
    CREATE: '/bookings',
    GET_DETAIL: (id) => `/bookings/${id}`,
    UPDATE: (id) => `/bookings/${id}`,
    DELETE: (id) => `/bookings/${id}`,
  },
  DRIVERS: {
    GET_PROFILE: (id) => `/drivers/${id}`,
    GET_STATS: (id) => `/drivers/${id}/stats`,
  },
  PASSENGERS: {
    GET_PROFILE: (id) => `/passengers/${id}`,
  },
  HEALTH: '/health',
};

export default API_ENDPOINTS;
