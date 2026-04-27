import mongoose from 'mongoose'
import { testPinataConnection } from '../config/pinata'

type PinataStatus = {
  status: 'unknown' | 'healthy' | 'unhealthy'
  lastChecked: string | null
  message: string
}

class HealthService {
  private pinataStatus: PinataStatus
  constructor() {
    this.pinataStatus = {
      status: 'unknown',
      lastChecked: null,
      message: 'Not yet tested',
    }
    this.initializePinataStatus()
  }

  async initializePinataStatus() {
    await this.testPinataConnectivity()
  }

  async testPinataConnectivity() {
    try {
      const result = await testPinataConnection()
      this.pinataStatus = {
        status: result.connected ? 'healthy' : 'unhealthy',
        lastChecked: new Date().toISOString(),
        message: result.message,
      }
      console.log(
        result.connected
          ? '✅ Pinata connectivity verified'
          : '❌ Pinata connectivity test failed',
        result.message,
      )
    } catch (error: any) {
      this.pinataStatus = {
        status: 'unhealthy',
        lastChecked: new Date().toISOString(),
        message: error.message,
      }
      console.log('❌ Pinata connectivity test failed:', error.message)
    }
  }

  async checkMongoDBHealth() {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping()
        return 'healthy'
      } else {
        return 'unhealthy'
      }
    } catch {
      return 'unhealthy'
    }
  }

  getPinataHealth() {
    return {
      status: this.pinataStatus.status,
      lastChecked: this.pinataStatus.lastChecked,
      message: this.pinataStatus.message,
    }
  }

  async getOverallHealth() {
    const mongoStatus = await this.checkMongoDBHealth()
    const pinataHealth = this.getPinataHealth()

    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        pinata: pinataHealth,
      },
    }

    if (mongoStatus === 'unhealthy') {
      healthStatus.status = 'DEGRADED'
    }

    if (pinataHealth.status === 'unhealthy') {
      healthStatus.status = 'DEGRADED'
    }

    if (mongoStatus === 'unhealthy' && pinataHealth.status === 'unhealthy') {
      healthStatus.status = 'UNHEALTHY'
    }

    return healthStatus
  }

  getStatusCode(status: 'OK' | 'DEGRADED' | 'UNHEALTHY') {
    switch (status) {
      case 'OK':
        return 200
      case 'DEGRADED':
        return 503
      case 'UNHEALTHY':
        return 500
      default:
        return 500
    }
  }
}

export default HealthService
