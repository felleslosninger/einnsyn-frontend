# Modal container

The `ModalContainer` component is always rendered in the `root.tsx` component. This is to ensure that the modal container is always rendered over the current route. When a splat-route has splat-params the component checks if the params should render a modal. The `ModalContainer` component is responsible for rendering the correct modal template based on the splat param. The splat param is the param in the route segment that doesn't match a route. A wider explanation of the splat param can be found in the [routes](/app/routes/readme.md) section.

The `ModalContainer` returns a modal `EinModal` along with a template.

## Modal templates

All modal templates, including their child templates, are kept in this folder and imported into the `ModalContainer` component. A modal template consists of:

- **slugs** A string used to determine the appropriate template for rendering within the `ModalContainer` component. For instance, in the Login.tsx template, the slugs consist of values such as `['login', 'logg-inn']`. Inside the ModalContainer component, the active template is determined by searching through the imported modal templates. The first segment of the splat param is checked against these slugs. If a match is found, the corresponding template is rendered.

- **Render** This component is the one to be rendered within the body of `EinModal`. It accepts a prop named `pathParams`, which represents a portion of the split splat params array excluding the first element. For example, if the splat params = `/login/reset`, then `pathParams='reset'.` This component is wrapped in `EinTransition` to enable smooth transitions between its child components. Similarly, this component incorporates imported templates, which constitute the child components of the modal template that needs to be rendered. As an illustration, when the splat param is `login/forgot-password`, the `ModalContainer` will render the `render` function of the Login template. This, in turn, will render the `PasswordResetRequestForm` form, based on the slugs within the `PasswordResetRequestForm` component, using the getTemplate helper function.

- **Title** This is also a function component that takes the `pathParams` prop and identifies the appropriate template to render based on the slugs. If `pathParams` is undefined, the title function returns a string sourced from the modal template. The title itself is displayed within the header of `EinModal`.

- **action** Exported as an action function within the modal template, this function is returned by the `action` function in the `ModalContainer` component. The `action` function within the modal template evaluates the `pathParams` to determine the template to select (as described earlier). It then returns the relevant action. For instance, if the modal template is associated with the `LoginForm` template, its action will be returned. This subsequently becomes the action executed within the respective route.

- **loader** Exactly as the action, but for the loader. The `loader` is returned by the loader function within the `ModalContainer` component. If there is no active template or no splat params, a 404 response is triggered with the `notFound` function.
