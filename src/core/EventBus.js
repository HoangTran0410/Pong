// Event Bus System for Game Communication
// Provides subscribe/emit functionality for decoupled component communication

import { generateId } from "../utils/index.js";

class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} context - Optional context for the callback (this binding)
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventName, callback, context = null) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listener = {
      callback,
      context,
      id: generateId("listener"),
    };

    this.events.get(eventName).push(listener);

    // Return unsubscribe function
    return () => this.unsubscribe(eventName, listener.id);
  }

  /**
   * Subscribe to an event only once
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} context - Optional context for the callback
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback, context = null) {
    const unsubscribe = this.subscribe(
      eventName,
      (...args) => {
        unsubscribe();
        if (context) {
          callback.apply(context, args);
        } else {
          callback(...args);
        }
      },
      context
    );

    return unsubscribe;
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {string} listenerId - ID of the listener to remove
   */
  unsubscribe(eventName, listenerId) {
    if (!this.events.has(eventName)) return;

    const listeners = this.events.get(eventName);
    const index = listeners.findIndex((listener) => listener.id === listenerId);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    // Clean up empty event arrays
    if (listeners.length === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName - Name of the event to emit
   * @param {...any} args - Arguments to pass to event listeners
   */
  emit(eventName, ...args) {
    if (!this.events.has(eventName)) return;

    const listeners = this.events.get(eventName);

    // Create a copy to avoid issues if listeners modify the array during iteration
    [...listeners].forEach((listener) => {
      try {
        if (listener.context) {
          listener.callback.apply(listener.context, args);
        } else {
          listener.callback(...args);
        }
      } catch (error) {
        console.error(`Error in event listener for '${eventName}':`, error);
      }
    });
  }

  /**
   * Remove all listeners for a specific event
   * @param {string} eventName - Name of the event to clear
   */
  clear(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get all event names that have listeners
   * @returns {Array<string>} Array of event names
   */
  getEventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Get listener count for an event
   * @param {string} eventName - Name of the event
   * @returns {number} Number of listeners
   */
  getListenerCount(eventName) {
    return this.events.has(eventName) ? this.events.get(eventName).length : 0;
  }

  /**
   * Check if an event has any listeners
   * @param {string} eventName - Name of the event
   * @returns {boolean} True if event has listeners
   */
  hasListeners(eventName) {
    return this.getListenerCount(eventName) > 0;
  }
}

// Create a singleton instance for global use
const eventBus = new EventBus();

export { EventBus, eventBus };
export default eventBus;
