# My Vue 3 App

This project is a simple Vue 3 application that displays a list of students along with their courses. It features a reusable component called `StudentCard` that conditionally styles students based on their pass status.

## Project Structure

```
my-vue3-app
├── src
│   ├── App.vue                # Main application component
│   ├── components
│   │   └── StudentCard.vue    # Reusable component for displaying student information
│   ├── main.ts                # Entry point of the Vue application
│   └── styles
│       └── main.css           # Global styles for the application
├── index.html                 # Main HTML file serving the Vue application
├── package.json               # Configuration file for npm
├── tsconfig.json              # TypeScript configuration file
├── tsconfig.node.json         # TypeScript configuration specific to Node.js
├── vite.config.ts             # Configuration for Vite
└── README.md                  # Documentation for the project
```

## Installation

To get started with the project, clone the repository and install the dependencies:

```bash
npm install
```

## Running the Application

To run the application in development mode, use the following command:

```bash
npm run dev
```

## Building for Production

To build the application for production, use:

```bash
npm run build
```

## Usage

The `StudentCard` component can be used to display individual student information. It accepts the following props:

- `name`: The name of the student.
- `course`: The course the student is enrolled in.
- `passed`: A boolean indicating whether the student has passed.

Example usage in `App.vue`:

```vue
<StudentCard
  v-for="student in students"
  :key="student.id"
  :name="student.name"
  :course="student.course"
  :passed="student.passed"
/>
```

## License

This project is licensed under the MIT License.