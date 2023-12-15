const yaml = require('js-yaml');
const fs = require('fs');
const axios = require('axios');

const calculateHealth = async (data) => {

    let latency, startTime, endTime;
    let stats = {};

    data.forEach(serverInfo => {
        const url = serverInfo.url;
        const recordAppended = false;

        // Iterate over the keys in stats
        for (const key in stats) {
            if (key.includes(url)) {
                // If the key contains the substring, update the values
                stats[key].total += 1;
                recordAppended = true
                return; // Exit the loop if a matching key is found
            }
        }

        if (recordAppended) {
            return;
        }

        // If no matching key is found, create a new entry
        stats[url] = {
            up: 0,
            total: 0
        };
    });

    //Use Promise.all to wait for all axios requests to complete
    await Promise.all(data.map(async (serverInfo) => {

        const { headers, method, body, name, url } = serverInfo

        const requestConfig = {
            method: method,
            url: url,
            headers: headers,
            data: body ? JSON.parse(body) : null
        };

        startTime = Date.now();

        try {
            const response = await axios(requestConfig);

            endTime = Date.now();
            latency = endTime - startTime;

            if (response.status >= 200 && response.status <= 299 && latency < 500) {
                for (const key in stats) {
                    if (key.includes(stats[url])) {
                        stats[url].up += 1;
                        return;
                    }
                }
            }

        } catch (err) {
            console.log(err);
        }
    }));


    let percentage;
    Object.keys(stats).forEach(key => {
        percentage = stats[key].up / stats[key].total * 100
        console.log(`${key} has availibility of ${percentage}`)
    });
};

try {
    const delayTime = 15000;
    const yamlFile = fs.readFileSync('test.yaml', 'utf8');
    const data = yaml.load(yamlFile);

    setInterval(() => {
        calculateHealth(data);
    }, delayTime);

} catch (e) {
    console.log('Error reading or parsing the YAML file:', e);
}
