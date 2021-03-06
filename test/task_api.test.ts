import supertest from "supertest";
import mongoose from "mongoose";
import app from '../src/app';
import { initialDatabase, initialTasks, nonExistingId, taskDB, adminId} from './test.helper';
import  { TaskType } from '../src/model/tasksModel';

const api = supertest(app);

beforeEach(async() => {
    await initialDatabase();
});

describe('Getting the tasks ',() => {

    test('tasks are returned as json with status 200', async () => {
        await api
            .get('/tasks')
            .expect(200)
            .expect('Content-Type','application/json; charset=utf-8');
    });

    test('all tasks are returned', async () => {
        const response = await api.get('/tasks');
        expect(response.body).toHaveLength(initialTasks.length);
    });

    test('a specific task is within the returned tasks', async() => {
        const response = await api.get('/tasks');
        const arrayTasks = response.body as TaskType[];
        const content = arrayTasks.map(task => task.title);
        expect(content).toContain(
            'Llevar el auto a lavar'
        );

    });
});

describe('Getting tasks with specific id',() => {

    test('succes with a valid id', async() => {

        const token = await generateToken();
        const tasksInDb = await taskDB();
        const firstTask = tasksInDb[0];
        const fistTaskId = String(tasksInDb[0]._id);
        
        
        const resultTask = await api
        .get(`/tasks/${fistTaskId}`)
        .set('Authorization', token)
        .expect(200)
        .expect('Content-Type','application/json; charset=utf-8');
        

        const firstTaskToJson = JSON.parse(JSON.stringify(firstTask)) as TaskType;
        expect(resultTask.body).toEqual(firstTaskToJson);

    });

    test('fail with statuscode 404 if note does not exist', async() => {
        const token = await generateToken();
        const validNonExistingId = await nonExistingId();
        
        await api
        .get(`/tasks/${validNonExistingId}`)
        .set('Authorization', token)
        .expect(404);
    });

    test('fail with statuscode 400 if id is invalid', async() =>{
        const token = await generateToken();
        const invalidID = 123456789;
        await api
        .get(`/tasks/${invalidID}`)
        .set('Authorization', token)
        .expect(400);

    });
});

describe('Getting tasks with user details',() => {

    test('tasks with user are returned as json with status 200', async () => {
        interface IUser{
            _id:string,
            email:string
        }
        const token = await generateToken();

        const result = await api
            .get('/tasks/detail')
            .set('Authorization', token)
            .expect(200)
            .expect('Content-Type','application/json; charset=utf-8');

        const arrayTasks = result.body as TaskType[];
        const contentUsers = arrayTasks.map(task => task.user) as unknown as IUser[];
        const contentId = contentUsers.map(user => user._id);
        const userId = await adminId();

        expect(contentId).toContain(userId);      
    });
});

describe('Deletion of a task', () => {
    
    test('succeeds with status code 200 if task is deleted', async () => {
        const token = await generateToken();
        const taskStart = await taskDB();
        const taskToDelete = taskStart[0];
        const idTaskToDelete = String(taskStart[0]._id);
        
        await api
        .delete(`/tasks/${idTaskToDelete}`)
        .set('Authorization', token)
        .expect(200);
        
        const taskEnd = await taskDB();
        expect(taskEnd).toHaveLength(initialTasks.length - 1);
        
        const titles = taskEnd.map(task => task.title);
        expect(titles).not.toContain(taskToDelete.title);
    });
    
    test('delete fails with statuscode 404 if note does not exist', async() => {
        const token = await generateToken();
        const validNonExistingId = await nonExistingId();
        
        await api
        .delete(`/tasks/${validNonExistingId}`)
        .set('Authorization', token)
        .expect(404);
    });
    
    test('delete fails with statuscode 400 if id is invalid', async() =>{
        const token = await generateToken();
        const invalidID = 123456789;
        await api
        .delete(`/tasks/${invalidID}`)
        .set('Authorization', token)
        .expect(400);
        
    });
});

describe('Addition of a new task',() => {
    test('add task succeeds with valid data', async () => {
        
        const token = await generateToken();
        const newTask = {
            title:"Terminar de testear la api.",
            description:"Probando crear una task con test en jest",
            expirationDate:'2022-02-10'
            //user: "61fc89c0c81cea97e75195ad"
        };

        await api
            .post('/tasks')
            .set('Authorization', token)
            .send(newTask)
            .expect(200)
            .expect('Content-Type','application/json; charset=utf-8');

    });

    test('fails with status 400 if required fields are not completed ', async () => {

        const token = await generateToken();
        const newTask = {
            description:"Probando crear una task con test en jest",
            expirationDate:'2022-02-10'
        };

        await api
            .post('/tasks')
            .set('Authorization', token)
            .send(newTask)
            .expect(400);
    });

    test('fails with status code 400 if data invaild', async () => {

        const token = await generateToken();
        const newTask = {
            title: 123412,
            description:"Probando crear una task con test en jest",
            expirationDate:'2022-02-10'
        };

        await api
            .post('/tasks')
            .set('Authorization', token)
            .send(newTask)
            .expect(400);
    });
});

describe('Update of a task',() => {
    test('succeeds update with valid data', async () => {
        
        const token = await generateToken();

        const taskInDbStart = await taskDB();
        const taskToUpdate = taskInDbStart[0];
        const idTaskToUpdate = String(taskInDbStart[0]._id);

        const updateTask = {
            description:"Antes de ir a lavar el auto, pasar por la panaderia"
        };

        await api
            .put(`/tasks/${idTaskToUpdate}`)
            .set('Authorization', token)
            .send(updateTask)
            .expect(200)
            .expect('Content-Type','application/json; charset=utf-8');


        const taskInDbEnd = await taskDB();
        const descriptions = taskInDbEnd.map(task => task.description);
        expect(descriptions).not.toContain(taskToUpdate.description);
    });

    test('update fails with status code 400 if data invaild', async () => {

        const token = await generateToken();
        const taskInDbStart = await taskDB();
        const idTaskToUpdate = String(taskInDbStart[0]._id);

        const updateTask = {
            description:1231231
        };

        await api
            .put(`/tasks/${idTaskToUpdate}`)
            .set('Authorization', token)
            .send(updateTask)
            .expect(400);
    });

    test('update fail with statuscode 404 if note does not exist', async() => {
        const token = await generateToken();
        const validNonExistingId = await nonExistingId();
        
        await api
        .put(`/tasks/${validNonExistingId}`)
        .set('Authorization', token)
        .send({title:"titulo de prueba."})
        .expect(404);
    });
    
    test('update fail with statuscode 400 if id is invalid', async() =>{
        const token = await generateToken();
        const invalidID = 123456789;
        await api
        .put(`/tasks/${invalidID}`)
        .set('Authorization', token)
        .send({title:"titulo de prueba."})
        .expect(400);
        
    });
    
});

//crear test para login con token y token incorrecto

afterAll(async () => {
    await mongoose.connection.close();
});

interface Itoken {
    token:string,
    email:string
}


export async function addTask(titleName:string) {
    
    const token = await generateToken();
    const newTask = {
        title:titleName,
        description:"Probando crear una task con test en jest",
        expirationDate:'2022-02-20'
    };
    
    const resultTask = await api
    .post('/tasks')
    .set('Authorization', token)
    .send(newTask);
    
    return resultTask;
}
export async function generateToken(){
    const user = {
        "email":"admin@gmail.com",
        "password":"password12356"
    };
    const response = await api.post('/login').send(user);
    const {token} = <Itoken>response.body;
    return token;
}