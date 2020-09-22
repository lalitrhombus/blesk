function popoutInitHandler(event) {
    if(!event.data.isChildEvent){
        eventClass.publish(event.data.topic, event.data.data, true);
    }
}
(window as any).childListners = function childTopicHandler(detail) {
    eventClass.publish(detail.topic, detail.data);
};
if (window && !(window as any).bleskObj) {
    (window as any).bleskObj = {
        status: 'init',
        registry: {},
        popOuts: {}
    };
    (window as any).addEventListener("message", popoutInitHandler, false);
}
var _a = (window as any).bleskObj, registry = _a.registry, popOuts = _a.popOuts;
function errorHandler(err) {
    throw new Error(err);
}
function dispatch(topic, data, isChildEvent) {
    Object.keys(popOuts).forEach(function (win) {
        popOuts[win].postMessage({
            topic: topic,
            data: data,
            isChildEvent
        }, '*');
    });
    return (window as any).dispatchEvent(new CustomEvent(topic, data));
}
function updateGlobalRegistryChange(topics, type) {
    return dispatch('BLESK_EVENT_LIST_UPDATED', { topics: topics, type: type }, false);
}
/**
 * Event Class
 */
function EventClass() {
    /**
     * @param  {} topic
     * @param  {} handler
     */
    this.register = function registerHandler(topic, handler) {
        try {
            if (!registry[topic]) {
                registry[topic] = {
                    name: topic,
                    handlers: []
                };
            }
            registry[topic].handlers.push(handler);
            updateGlobalRegistryChange([topic], 'ADD');
            return {
                status: true,
                status_code: 'TOPIC_REGISTERED',
                message: 'Topic Ragistered'
            };
        }
        catch (err) {
            return errorHandler(err);
        }
    },
        /**
         * @param  {} topic
         * @param  {} handler
         */
        this["delete"] = function deleteHandler(topic, handler) {
            try {
                if (!registry[topic]) {
                    return {
                        status: false,
                        error_code: "NOT_FOUND",
                        message: "Topic Not Found"
                    };
                }
                if (handler) {
                    var updatedHandlersList = [];
                    var handlerFound = false;
                    registry[topic].handlers.forEach(function (element) {
                        if (handler === element) {
                            handlerFound = true;
                        }
                        else {
                            updatedHandlersList.push(handler);
                        }
                    });
                    registry[topic].handlers = updatedHandlersList;
                    if (handlerFound) {
                        updateGlobalRegistryChange([topic], 'UPDATE');
                        return {
                            status: true,
                            status_code: "HANDLER_UPDATED",
                            message: "Handler Deleted"
                        };
                    }
                    return {
                        status: false,
                        error_code: "HANDLER_NOT_FOUND",
                        message: "handler not found, topic as it is"
                    };
                }
                delete registry[topic];
                updateGlobalRegistryChange([topic], 'DELETE');
                return {
                    status: true,
                    status_code: 'EVENT_DELETED',
                    message: 'Event deleted succesfully'
                };
            }
            catch (err) {
                return errorHandler(err);
            }
        },
        /**
         * @param  {} topic
         */
        this.publish = function publishHandler(topic, data, isParentEvent) {
            try {
                var isChildEvent = false;
                if ((window as any).opener && !isParentEvent) {
                    (window as any).opener.childListners({
                        topic: topic,
                        data: data
                    });
                    isChildEvent = true;
                }
                dispatch(topic, data, isChildEvent);

                if (!registry[topic]) {
                    return {
                        status: false,
                        error_code: "NOT_FOUND",
                        message: "Topic Not Found"
                    };
                }
                registry[topic].handlers.forEach(function (func) {
                    func(data); // TODO: Make these as promise execution
                });
                return {
                    status: true,
                    status_code: 'EVENT_PUBLISHED',
                    message: 'Event Published'
                };
            }
            catch (err) {
                return errorHandler(err);
            }
        },
        /**
         * @param  {} topic
         */
        this.get = function getHandler(topic) {
            try {
                return {
                    data: registry,
                    status: true,
                    status_code: 'DATA_FOUND',
                    message: 'Found list of event ragistered'
                };
            }
            catch (err) {
                return errorHandler(err);
            }
        };
}
/**
 * Child Class
 */
function ChildClass() {
    this.Childrens = [];
    this.open = function openHandler(url, windowName) {
        try {
            popOuts[windowName] = (window as any).open(url, windowName);
            // popOuts[windowName].blur();
            return popOuts[windowName];
        }
        catch (error) {
            return errorHandler(error);
        }
    };
    this.get = function listHandler(windowName) {
        try {
            return popOuts[windowName];
        }
        catch (error) {
            return errorHandler(error);
        }
    };
    this.close = function listHandler(windowName) {
        try {
            return popOuts[windowName].close();
        }
        catch (error) {
            return errorHandler(error);
        }
    };
}
/**
 * Root object to return in class
 */
var eventClass = new EventClass();
var child = new ChildClass();
var blesk = {
    event: eventClass,
    child: child,
    bleskObj: (window as any).bleskObj
};
module.exports = blesk;
