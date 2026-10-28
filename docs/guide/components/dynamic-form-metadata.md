---
title: "Build a Dynamic Form Using Metadata"
id: "dynamic-form-metadata"
sidebar_label: "Dynamic Form with Metadata"
last_update: { author: "Pinnoji Vinith Krishna" }
---

## Overview

A Dynamic Form in WaveMaker renders its fields at runtime based on a metadata object, rather than being statically configured at design time. Use this approach when the fields your form needs to display are determined by a backend service or vary across contexts. By the end of this guide, you will have a fully functional dynamic form that reads field definitions from a variable and renders the appropriate components automatically.

---

## Prerequisites

Before you begin, make sure you have:

- A WaveMaker project open in Studio
- A backend service (REST, Java, or imported API) that returns field metadata — or a Static Variable you can use to prototype

---

## Step 1 — Prepare the Metadata Service and Variable

The Dynamic Form expects metadata in the following structure:

```json
[
  {
    "name": "",         
    "displayname": "",  
    "type": "",         
    "required": "",     
    "widget": "",       
    "dataset": ""       
  }
]
```

| Property      | Description                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| `name`        | Field name (required)                                                           |
| `displayname` | Label shown in the form UI for the field; used as the display name.             |
| `type`        | Data type — defaults to `string` if omitted                                     |
| `required`    | Whether the field is required                                                   |
| `widget`      | Component type used to render the field in the form                             |
| `dataset`     | Options for dataset components (`select`, `radioset`, `autocomplete`, `switch`) |

1. Create or import the service that returns your field metadata.
2. In WaveMaker Studio, go to **Variables** and create a new Service Variable bound to that service.
3. Set the variable to call **on page load** so the metadata is available when the form renders.

:::tip
If your service returns data in a different structure, you do not need to change the service. Transform the data in the form's `on-beforerender` event — see [Step 3](#step-3-optional--transform-metadata-with-on-beforerender).
:::

---

## Step 2 — Configure the Form Markup

1. Drag a **Form** component onto your page canvas.
2. Switch to the **Markup** tab.
3. Add the `metadata` property to the `<wm-form>` tag and bind it to your variable's `dataSet`:

```xml
<wm-form
  name="form"
  captionposition="top"
  captionalign="left"
  enctype="application/x-www-form-urlencoded"
  method="post"
  metadata="bind:Variables.variableName.dataSet"
  itemsperrow="xs-2 sm-2 md-2 lg-2"
  show="true"
>
  <wm-container
    direction="row"
    alignment="top-left"
    wrap="true"
    width="fill"
    columns="2"
    name="container2"
    class="app-container-default"
    variant="default"
  ></wm-container>
  <wm-form-action
    key="reset"
    class="form-reset btn-default btn-filled"
    iconclass="wi wi-refresh"
    display-name="Reset"
    type="reset"
  ></wm-form-action>
  <wm-form-action
    key="save"
    class="form-save btn-primary btn-filled"
    iconclass="wi wi-save"
    display-name="Save"
    type="submit"
  ></wm-form-action>
</wm-form>
```

Replace `variableName` with the name of the variable you created in Step 1.

{/* TODO: Add screenshot — Markup tab showing the metadata property bound to the variable */}

:::note
When `metadata` is bound, the form ignores any statically added form fields and renders only what the metadata specifies at runtime.
:::

---

## Step 3 (Optional) — Transform Metadata with on-beforerender

If your service returns data in a structure that does not match the expected format, use the `on-beforerender` event to map it before the form renders.

1. Add the `on-beforerender` attribute to the `<wm-form>` tag in markup:

```xml
<wm-form
  name="formUserDetails"
  metadata="bind:Variables.createUserDetails.dataSet"
  on-beforerender="formUserDetailsBeforeRender($metadata, widget)"
>
```

{/* TODO: Add screenshot — Markup tab with on-beforerender attribute highlighted */}

2. Open the **Script** tab and implement the handler. Return an array of field definition objects in the expected format:

```js
Page.formUserDetailsBeforeRender = function($metadata, widget) {
    return [
        {
            name: 'firstname',
            displayname: 'First Name',
            widget: 'select',
            dataset: 'Eric,Brad,Sample,Amanda'
        },
        {
            name: 'lastname',
            displayname: 'Last Name'
        },
        {
            name: 'age',
            displayname: 'User Age',
            type: 'integer',
            widget: 'number'
        },
        {
            name: 'gender',
            displayname: 'Gender',
            widget: 'radioset',
            dataset: 'Male,Female'
        },
        {
            name: 'phonenumber',
            displayname: 'Phone Number'
        }
    ];
};
```

{/* TODO: Add screenshot — Runtime form rendered with the mapped fields */}

:::tip
The `$metadata` parameter receives the raw data from your variable. Use it to derive field definitions dynamically instead of hardcoding them, so the form adapts automatically when your service data changes.
:::

---

## Step 4 — Handle Form Submission

To process the submitted data when the user clicks **Save**, implement the `onBeforeSubmit` event.

1. Select the Form component on the canvas.
2. In the **Events** panel, locate **On Before Submit** and click the handler icon to open the script editor.
3. Perform validations or pre-submit logic before saving the form data. If the validation fails, return false to stop the submission; otherwise proceed with actions like invoking a Service Variable or navigating to another page after a successful save.

```js
Page.formUserDetailsBeforeSubmit = function($event, widget, $data) {
     if ($data.firstName == undefined) {
    // Assumes that the Notification Action "notificationAction" is already created
    Page.Actions.notificationAction.invoke({
      "class": "error",
      "message": "First name cannot be empty",
      "position": "center center"
    });

    return false; // Stop the form submission
  }
};
```

---

## Field Properties Reference

### Supported data types

`big_decimal`, `big_integer`, `blob`, `boolean`, `byte`, `character`, `clob`, `date`, `datetime`, `double`, `float`, `integer`, `list`, `long`, `short`, `string`, `text`, `time`, `timestamp`

### Supported component types

`autocomplete`, `checkbox`, `checkboxset`, `currency`, `date`, `datetime`, `number`, `password`, `radioset`, `rating`, `richtext`, `select`, `slider`, `switch`, `text`, `textarea`, `time`, `timestamp`, `upload`

### Common properties (all components)

| Property            | Description                                |
| ------------------- | ------------------------------------------ |
| `placeholder`       | Placeholder text shown inside the input    |
| `hint`              | Tooltip hint for the field                 |
| `tabindex`          | Tab order index                            |
| `defaultvalue`      | Value pre-filled when the form loads       |
| `required`          | Marks the field as required                |
| `validationmessage` | Custom message shown on validation failure |
| `readonly`          | Makes the field read-only                  |
| `disabled`          | Disables the field                         |
| `show`              | Controls field visibility                  |

### Additional properties for dataset components

Applies to `select`, `radioset`, `switch`, and `autocomplete`:

| Property       | Description                                          |
| -------------- | ---------------------------------------------------- |
| `dataset`      | Comma-separated values or a bound dataset            |
| `displayfield` | Field from the dataset to display as the label       |
| `datafield`    | Field from the dataset to use as the submitted value |
| `orderby`      | Sort order for dataset items                         |

---
