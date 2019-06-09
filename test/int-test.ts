import AWS from 'aws-sdk';
import { CreateStackInput, ResourceStatus } from 'aws-sdk/clients/cloudformation';
import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { LOG_NAME, Monitor } from '../index';

const name = 'aws-cf-monitor-integration-test';
const templateFile = path.join(__dirname, 'int-test.yaml');
const template = fs.readFileSync(templateFile, 'utf8');
const input: CreateStackInput = {StackName: name, TemplateBody: template};

winston.loggers.add(LOG_NAME, {
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});

const cf = new AWS.CloudFormation();

cf.createStack(input).promise()
    .then(() => new Monitor().monitor(name, cf))
    .then((status: ResourceStatus) => {
        console.log(`Hooray, the stack is ${status}`);
        console.log('And I didn\'t have to write a bunch of boilerplate to wait for it!');
    })
    .then(() => cf.deleteStack({StackName: name}).promise())
    .then(() => new Monitor().monitor(name, cf))
    .then((status: ResourceStatus) => {
        console.log(`Hooray, the stack is ${status}`);
        console.log('And I didn\'t have to write a bunch of boilerplate to wait for it!');
    });
