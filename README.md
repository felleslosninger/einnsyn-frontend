# <img src="https://einnsyn.no/8ebf89f8e40d3eb75183.svg" width="180px" alt="eInnsyn"/>

> **⚠️ Work in Progress: Not Ready for Production ⚠️**
>
> This repository contains a new front-end application for eInnsyn and is currently under active development.

eInnsyn is a web service designed to enhance transparency in the Norwegian public sector. It offers a user-friendly web interface that allows the public to search for and access documents from various government bodies. This repository contains the source code for the front-end application.

This project is officially developed and maintained by the **Norwegian Digitalisation Agency** (Digitaliseringsdirektoratet).

### Built With

This project is built with the following technologies:

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Sass](https://sass-lang.com/)

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

You need to have Node.js and a package manager installed on your system.

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/felleslosninger/einnsyn-frontend.git
    ```
2.  **Navigate to the project directory**
    ```sh
    cd einnsyn-frontend
    ```
3.  **Install packages**
    ```sh
    npm install
    ```
4.  **Set up environment variables**

    The application requires several environment variables to connect to the eInnsyn back-end API and other services. Create a `.env.local` file in the root of the project:

    ```
    # URL for the backend API
    API_URL=http://localhost:8080

    # Secret for encrypting cookies
    COOKIE_SECRET=a_strong_and_secret_key_at_least_32_characters_long

    # Ansattporten OIDC configuration
    ANSATTPORTEN_URL=https://...
    ANSATTPORTEN_CLIENT_ID=...
    ANSATTPORTEN_CLIENT_SECRET=...
    ```

### Running the Application

Once the installation is complete, you can run the development server. There are several scripts available to connect to different backend environments:

- **To connect to a local backend (default):**

  ```sh
  npm run dev
  ```

- **To connect to the `dev` environment:**

  ```sh
  npm run dev:dev
  ```

- **To connect to the `test` environment:**

  ```sh
  npm run dev:test
  ```

- **To connect to the `production` environment:**
  ```sh
  npm run dev:prod
  ```

This will start the application at `http://localhost:3000`.

## License

eInnsyn is Open Source software released under the [BSD-3-Clause license](LICENSE).

## References

- [eInnsyn API Specification](https://github.com/felleslosninger/einnsyn-api-spec/)
- [eInnsyn Backend](https://github.com/felleslosninger/einnsyn-backend/)
