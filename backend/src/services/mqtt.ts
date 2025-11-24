import mqtt, { MqttClient } from 'mqtt';
import { KidModel, Kid } from '../models/Kid';
import { TaskModel, Task } from '../models/Task';

interface MqttConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
}

interface SupervisorMqttResponse {
  result: string;
  data: {
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
}

class MqttService {
  private client: MqttClient | null = null;
  private config: MqttConfig | null = null;
  private discoveryPrefix = 'homeassistant';
  private statePrefix = 'familyflow';
  private isConnected = false;

  async initialize(): Promise<void> {
    // Try to get MQTT config from environment or HA Supervisor
    this.config = await this.getMqttConfig();

    if (!this.config) {
      console.log('MQTT: No MQTT broker configured, skipping MQTT integration');
      return;
    }

    await this.connect();
  }

  private async getMqttConfig(): Promise<MqttConfig | null> {
    // First, check environment variables
    if (process.env.MQTT_HOST) {
      return {
        host: process.env.MQTT_HOST,
        port: parseInt(process.env.MQTT_PORT || '1883'),
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
      };
    }

    // Try to discover MQTT from Home Assistant Supervisor API
    const supervisorToken = process.env.SUPERVISOR_TOKEN;
    if (supervisorToken) {
      try {
        const response = await fetch('http://supervisor/services/mqtt', {
          headers: {
            'Authorization': `Bearer ${supervisorToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json() as SupervisorMqttResponse;
          if (data.data && data.data.host) {
            console.log('MQTT: Discovered broker via Supervisor API');
            return {
              host: data.data.host,
              port: data.data.port || 1883,
              username: data.data.username,
              password: data.data.password,
            };
          }
        }
      } catch (error) {
        console.log('MQTT: Could not discover broker via Supervisor:', error);
      }
    }

    return null;
  }

  private async connect(): Promise<void> {
    if (!this.config) return;

    const url = `mqtt://${this.config.host}:${this.config.port}`;

    const options: mqtt.IClientOptions = {
      clientId: `familyflow_${Date.now()}`,
      clean: true,
      connectTimeout: 30000,
      reconnectPeriod: 5000,
    };

    if (this.config.username) {
      options.username = this.config.username;
      options.password = this.config.password;
    }

    console.log(`MQTT: Connecting to ${url}...`);

    this.client = mqtt.connect(url, options);

    this.client.on('connect', async () => {
      console.log('MQTT: Connected to broker');
      this.isConnected = true;

      // Publish discovery configs for all kids
      await this.publishAllDiscoveryConfigs();

      // Publish initial states
      await this.publishAllStates();
    });

    this.client.on('error', (error) => {
      console.error('MQTT: Connection error:', error);
    });

    this.client.on('close', () => {
      console.log('MQTT: Connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      console.log('MQTT: Reconnecting...');
    });
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => {
        const map: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
        return map[match] || match;
      })
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private async publishAllDiscoveryConfigs(): Promise<void> {
    const kids = await KidModel.findAll();

    for (const kid of kids) {
      await this.publishDiscoveryConfig(kid);
    }
  }

  async publishDiscoveryConfig(kid: Kid): Promise<void> {
    if (!this.client || !this.isConnected) return;

    const slug = this.slugify(kid.name);
    const uniqueId = `familyflow_${kid.id}`;

    // Tasks completed sensor (e.g., "3/5")
    const tasksConfig = {
      name: `${kid.name} Tasks`,
      unique_id: `${uniqueId}_tasks`,
      state_topic: `${this.statePrefix}/${kid.id}/tasks/state`,
      json_attributes_topic: `${this.statePrefix}/${kid.id}/tasks/attributes`,
      icon: 'mdi:clipboard-check-outline',
      device: {
        identifiers: [uniqueId],
        name: `FamilyFlow - ${kid.name}`,
        manufacturer: 'FamilyFlow',
        model: 'Child Tasks',
      },
    };

    // All tasks done binary sensor
    const allDoneConfig = {
      name: `${kid.name} All Tasks Done`,
      unique_id: `${uniqueId}_all_done`,
      state_topic: `${this.statePrefix}/${kid.id}/all_done/state`,
      payload_on: 'ON',
      payload_off: 'OFF',
      device_class: 'running',
      icon: 'mdi:check-circle',
      device: {
        identifiers: [uniqueId],
        name: `FamilyFlow - ${kid.name}`,
        manufacturer: 'FamilyFlow',
        model: 'Child Tasks',
      },
    };

    // Tasks in progress sensor
    const inProgressConfig = {
      name: `${kid.name} Tasks In Progress`,
      unique_id: `${uniqueId}_in_progress`,
      state_topic: `${this.statePrefix}/${kid.id}/in_progress/state`,
      icon: 'mdi:progress-clock',
      device: {
        identifiers: [uniqueId],
        name: `FamilyFlow - ${kid.name}`,
        manufacturer: 'FamilyFlow',
        model: 'Child Tasks',
      },
    };

    // Tasks todo sensor
    const todoConfig = {
      name: `${kid.name} Tasks Todo`,
      unique_id: `${uniqueId}_todo`,
      state_topic: `${this.statePrefix}/${kid.id}/todo/state`,
      icon: 'mdi:clipboard-list-outline',
      device: {
        identifiers: [uniqueId],
        name: `FamilyFlow - ${kid.name}`,
        manufacturer: 'FamilyFlow',
        model: 'Child Tasks',
      },
    };

    // Publish discovery configs
    await this.publish(`${this.discoveryPrefix}/sensor/${uniqueId}_tasks/config`, JSON.stringify(tasksConfig), true);
    await this.publish(`${this.discoveryPrefix}/binary_sensor/${uniqueId}_all_done/config`, JSON.stringify(allDoneConfig), true);
    await this.publish(`${this.discoveryPrefix}/sensor/${uniqueId}_in_progress/config`, JSON.stringify(inProgressConfig), true);
    await this.publish(`${this.discoveryPrefix}/sensor/${uniqueId}_todo/config`, JSON.stringify(todoConfig), true);

    console.log(`MQTT: Published discovery config for ${kid.name}`);
  }

  async removeDiscoveryConfig(kidId: number): Promise<void> {
    if (!this.client || !this.isConnected) return;

    const uniqueId = `familyflow_${kidId}`;

    // Remove all discovery configs by publishing empty payloads
    await this.publish(`${this.discoveryPrefix}/sensor/${uniqueId}_tasks/config`, '', true);
    await this.publish(`${this.discoveryPrefix}/binary_sensor/${uniqueId}_all_done/config`, '', true);
    await this.publish(`${this.discoveryPrefix}/sensor/${uniqueId}_in_progress/config`, '', true);
    await this.publish(`${this.discoveryPrefix}/sensor/${uniqueId}_todo/config`, '', true);

    console.log(`MQTT: Removed discovery config for kid ${kidId}`);
  }

  private async publishAllStates(): Promise<void> {
    const kids = await KidModel.findAll();

    for (const kid of kids) {
      await this.publishKidState(kid.id);
    }
  }

  async publishKidState(kidId: number): Promise<void> {
    if (!this.client || !this.isConnected) return;

    const tasks = await TaskModel.findByKidId(kidId);
    const stats = this.calculateTaskStats(tasks);

    // Publish states
    await this.publish(`${this.statePrefix}/${kidId}/tasks/state`, `${stats.completed}/${stats.total}`);
    await this.publish(`${this.statePrefix}/${kidId}/all_done/state`, stats.completed === stats.total && stats.total > 0 ? 'ON' : 'OFF');
    await this.publish(`${this.statePrefix}/${kidId}/in_progress/state`, stats.inProgress.toString());
    await this.publish(`${this.statePrefix}/${kidId}/todo/state`, stats.todo.toString());

    // Publish detailed attributes
    const attributes = {
      total_tasks: stats.total,
      completed_tasks: stats.completed,
      in_progress_tasks: stats.inProgress,
      todo_tasks: stats.todo,
      completion_percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      task_list: tasks.map(t => ({
        title: t.title,
        status: t.status,
        recurrence: t.recurrence_type,
      })),
      last_updated: new Date().toISOString(),
    };

    await this.publish(`${this.statePrefix}/${kidId}/tasks/attributes`, JSON.stringify(attributes));

    console.log(`MQTT: Published state for kid ${kidId}: ${stats.completed}/${stats.total} tasks`);
  }

  private calculateTaskStats(tasks: Task[]): TaskStats {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'erledigt').length,
      inProgress: tasks.filter(t => t.status === 'mach_ich_gerade').length,
      todo: tasks.filter(t => t.status === 'zu_erledigen').length,
    };
  }

  private publish(topic: string, message: string, retain: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        resolve();
        return;
      }

      this.client.publish(topic, message, { retain }, (error) => {
        if (error) {
          console.error(`MQTT: Failed to publish to ${topic}:`, error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async onTaskChanged(task: Task): Promise<void> {
    await this.publishKidState(task.kid_id);
  }

  async onKidCreated(kid: Kid): Promise<void> {
    await this.publishDiscoveryConfig(kid);
    await this.publishKidState(kid.id);
  }

  async onKidDeleted(kidId: number): Promise<void> {
    await this.removeDiscoveryConfig(kidId);
  }

  isEnabled(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const mqttService = new MqttService();
