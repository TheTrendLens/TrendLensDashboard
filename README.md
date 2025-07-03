# TrendlensFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Environment Configuration

This application uses environment-specific configuration files for sensitive information such as API URLs, Firebase configuration, and Stripe keys. The configuration is stored in:

- `src/environments/environment.ts` for production
- `src/environments/environment.development.ts` for development

### Development vs Production

- For development, the application uses the configuration in `environment.development.ts`, which includes test keys (e.g., Stripe test keys that start with `pk_test_`)
- For production, the application uses the configuration in `environment.ts`, which includes live keys (e.g., Stripe live keys that start with `pk_live_`)

### Modifying Configuration

To modify the configuration:

1. Edit the appropriate environment file based on your target environment
2. Update the values directly in the file
3. Rebuild the application to apply the changes

### Important Notes

- Keep sensitive keys and credentials secure
- Different environments (development, production) have different configurations
- The application uses the values defined in the environment files

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
