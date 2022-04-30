# Effective Enigma

Effective Enigma is a project built atop of Effect-TS library and Cloudflare's Worker API to
provide a simple, yet powerful, way to stream video and audio from your computer to your browser. It also
has built-in support for authentication and encryption for users who wish to use it. You can check the API Reference below.

## API Reference

### Public API

#### Create user

```http
  POST /v1/user
```

| Parameter  | Type     | Description                                  |
| :--------- | :------- | :------------------------------------------- |
| `name`     | `string` | **Required**. Name of the user to create     |
| `surname`  | `string` | **Required**. Lastname of the user to create |
| `password` | `string` | **Required**. Password of the user           |
| `email`    | `string` | **Required**. Email of the user              |

#### Login user

```http
  POST /v1/login
```

| Parameter  | Type     | Description                        |
| :--------- | :------- | :--------------------------------- |
| `password` | `string` | **Required**. Password of the user |
| `email`    | `string` | **Required**. Email of the user    |

### Private API (Authentication required bearer token)

#### Create live stream

```http
  POST /v1/create.stream
```

| Parameter | Type     | Description                    |
| :-------- | :------- | :----------------------------- |
| `name`    | `string` | **Required**. Live stream name |

#### Delete live stream

```http
  DELETE /v1/delete.stream
```

| Parameter | Type     | Description                  |
| :-------- | :------- | :--------------------------- |
| `id`      | `string` | **Required**. Live stream id |

#### Create live stream

```http
  POST /v1/create.stream
```

#### Update live stream from url

```http
  POST /v1/upload.copy
```

| Parameter   | Type     | Description                                                   |
| :---------- | :------- | :------------------------------------------------------------ |
| `url`       | `string` | **Required**. Live stream video url                           |
| `meta`      | `object` | **Required**. Object that contains how the name will be saved |
| `meta.name` | `string` | **Required**. Name of the video                               |

#### Update live stream from file

```http
  POST /v1/upload.file
```

| Parameter | Type        | Description                             |
| :-------- | :---------- | :-------------------------------------- |
| `file`    | `form-data` | **Required**. Video file to be uploaded |

#### Get user

```http
  GET /v1/user/${email}
```

## Environment Variables

To run this project, you will need to add the following environment variables to your shell:

`CF_ACCOUNT_ID`

`CF_API_TOKEN`

## Roadmap

- Migrate from Cloudflare Workers to Node

- Delete frontend piece from this project

- Add postgres database

- Write tests

- Add versioning to router library

## Run Locally

Clone the project

```bash
  git clone https://github.com/samgj18/effective-enigma.git
```

Go to the project directory

```bash
  cd effective-enigma
```

Install dependencies

```bash
  yarn
```

Start the server

```bash
  yarn dev
```

## Authors

- [@samgj18](https://www.github.com/samgj18)
- [@mikearnaldi](https://github.com/mikearnaldi)

## Issues

There is an open issue to migrate from the internal Cloudflare stub for the state to fully embrace Supabse Postgrest. For that reason this won't work on production unless a paid version of Cloudflare Workers is acquired. However, it works as expected on the dev env.
