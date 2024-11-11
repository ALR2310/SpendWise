const appSettings = {
    general: {
        defaultPage: "spend",
        language: "vi",
        notify: true,
        appUpdate: true,
    },
    spend: {
        defaultList: "spend",
        sort: "date",
    },
    data: {
        fileId: ""
    },
    version: 1 // only change when there is a change in the structure of appSettings
};

function mergeSettings(target, source) {
    for (const key in source) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            target[key] = target[key] || {};
            mergeSettings(target[key], source[key]);
        } else if (!(key in target)) target[key] = source[key];
    }
}

function removeOldSettings(target, source) {
    for (const key in target)
        if (!(key in source)) delete target[key];
        else if (typeof target[key] === 'object' && typeof source[key] === 'object')
            removeOldSettings(target[key], source[key]);
}

export default {
    init() {
        const storedSetting = JSON.parse(localStorage.getItem('appSettings'));

        if (!storedSetting || storedSetting.version !== appSettings.version)
            return localStorage.setItem('appSettings', JSON.stringify(appSettings));

        const updatedSettings = { ...storedSetting };
        mergeSettings(updatedSettings, appSettings);
        removeOldSettings(updatedSettings, appSettings);
        localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    },

    get(path) {
        const storedSetting = JSON.parse(localStorage.getItem('appSettings'));

        if (!storedSetting) return null;
        if (!path) return storedSetting;

        const keys = path.split('.');
        let result = storedSetting;

        for (let key of keys) result = result ? result[key] : undefined;
        return result;
    },

    set(path, value) {
        const storedSetting = JSON.parse(localStorage.getItem('appSettings')) || {};

        if (path) {
            const keys = path.split('.');
            let obj = storedSetting;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!obj[keys[i]]) obj[keys[i]] = {};
                obj = obj[keys[i]];
            }

            obj[keys[keys.length - 1]] = value;
            localStorage.setItem('appSettings', JSON.stringify(storedSetting));
        }
    }
};