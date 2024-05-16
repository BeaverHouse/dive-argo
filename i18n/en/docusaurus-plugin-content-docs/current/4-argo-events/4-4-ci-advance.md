---
sidebar_position: 4
---

# Complete CI pipeline

In this document, we will build an complete CI pipeline by integrating Argo Events to the existing CI workflow.

:::caution
Usually, we should receive events like "Push" from services such as GitHub.  
The service must be exposed to public IPs to accomplish this, but since the current test environment has no security-related settings, there is a risk involved.

So in this document, we'll perform GitHub push separately and manually add files to MinIO to trigger the event.
:::

## Modify git clone step

In the previous git clone step we only checked the files, but this time we'll read the latest tag and store it in the `version.txt` file to use it for setting image tags.  
If you connect to other services such as GitHub, you can apply this part in another way.

The example repository has tags set up as follows.

![Set tag to Github repo](img/4-4-github-tag.png)

Then, change the existing template as follows.

<!-- prettier-ignore -->
```yaml title="git-clone.yaml" {24-33}
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: git-clone
spec:
  serviceAccountName: huadmin
  templates:
    - name: checkout
      inputs:
        parameters:
          - name: git-url
          - name: revision
            value: "main"
        artifacts:
          - name: source-code
            path: /code
            git:
              repo: "{{inputs.parameters.git-url}}"
              revision: "{{inputs.parameters.revision}}"
      outputs:
        artifacts:
          - name: source-code
            path: /code
        parameters:
          - name: image-tag
            valueFrom:
              path: /code/version.txt
      script:
        image: bitnami/git:2.43.0
        workingDir: /code
        command: [bash]
        source: |
          git describe --tags --abbrev=0 > version.txt
```

After executing the modified workflow, the `version.txt` file is created, in which you can see the content: which is the latest tag value, `1.0.0`.

![Clone success](img/4-4-clone-success.png)

![Clone output file check](img/4-4-clone-output-check.png)

This value and source code is set as output for being used in the following steps.

## Auto-change image tag in Helm chart

Now, we'll write an additional workflow to automatically push the image tag to the Helm chart repository after building an image.

### Write sample Helm chart

Firstly, currently there's no Helm chart for the sample app, so I created it in a separate repository.  
The details of the Helm chart are not discussed here.

https://github.com/BeaverHouse/dive-argo-fastapi-helm

![Sample Helm chart test](img/4-4-helm-sample-test.png)

The image above is test deployment of the chart through the ingress controller.

:::info
The sample app and Helm chart used here have the base path set to '/'.  
If you want to deploy to a different base path, you have to change the settings.

For FastAPI, please refer to the following link.  
https://fastapi.tiangolo.com/advanced/behind-a-proxy/  
https://stackoverflow.com/q/60397218
:::

### Create GitHub token

To modify GitHub source code, related permission is required.  
You can control the source by using tokens, without setting up an account.[^1]

You can generate token from the link below.  
https://github.com/settings/tokens/new

Set up name and repository permission, then generate a token.

![Generate Github token](img/4-4-generate-token.png)

We need to encrypt this token value with base64 encoding.

```
echo -n <api-token-key> | base64
```

Use this encrypted value to write a secret in the Helm chart.

```yaml title="github-access.yaml"
apiVersion: v1
kind: Secret
metadata:
  name: github-access
type: Opaque
data:
  token: <base64-encoded-api-token-from-previous-step>
```

Apply changes with `helm upgrade` command.

### Write workflow

Now, let's write the actual step to modify the Helm chart.

<!-- prettier-ignore -->
```yaml title="chart-push.yaml" {20-25,29,37}
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: chart-push
spec:
  serviceAccountName: huadmin
  templates:
    - name: change-push
      inputs:
        parameters:
          - name: image-tag
          - name: github-user
            value: "HU-Lee"
          - name: repository
            value: "BeaverHouse/dive-argo-fastapi-helm"
          - name: revision
            value: "main"
      script:
        image: guidoffm/yq-git:latest
        env:
          - name: GITHUB_TOKEN
            valueFrom:
              secretKeyRef:
                name: github-access
                key: token
        command: [bash]
        workingDir: /code
        source: |
          git clone https://{{inputs.parameters.github-user}}:$GITHUB_TOKEN@github.com/{{inputs.parameters.repository}}.git --branch {{inputs.parameters.revision}} . 

          ls
          pwd

          git config --global user.name "HU-Lee (Argo)"
          git config --global user.email "haulrest@gmail.com"

          yq e -i '.image.tag = "{{inputs.parameters.image-tag}}"' fastapi-argo/values.yaml

          git add .
          git commit -m "change image tag to {{inputs.parameters.image-tag}}"

          git push origin {{inputs.parameters.revision}}
```

We should focus on 3 points:

- The API token value should be retrieved from the secret.
- When cloning with git, you need to use the token value in order to control the source code afterwards.
- We edit the `.yaml` file using [yq][yq].

Save the workflow and check if the tag is normally changed through testing.

![Repository push check](img/4-4-push-check.png)

## Run entire workflow with sensor

Now, we'll write the entire workflow in sensor file, including all previous steps.

<!-- prettier-ignore -->
```yaml {13-75}
apiVersion: argoproj.io/v1alpha1
kind: Sensor
metadata:
  name: argo-ci-sensor
spec:
  eventBusName: eventbus-jetstream
  template:
    serviceAccountName: huadmin
  dependencies:
    - name: minio-input
      eventSourceName: minio-event
      eventName: files
  triggers:
    - template:
        name: ci-trigger
        k8s:
          operation: create
          source:
            resource:
              apiVersion: argoproj.io/v1alpha1
              kind: Workflow
              metadata:
                generateName: argo-ci-
              spec:
                serviceAccountName: huadmin
                entrypoint: total-wf
                arguments:
                  parameters:
                    - name: git-url
                      value: https://github.com/BeaverHouse/dive-argo-fastapi
                    - name: FROM_ARGO
                      value: from argo-events
                    - name: image_name
                      value: fastapi-sample
                templates:
                  - name: total-wf
                    dag:
                      tasks:
                        - name: clone
                          arguments:
                            parameters:
                              - name: git-url
                                value: "{{workflow.parameters.git-url}}"
                          templateRef:
                            name: git-clone
                            template: checkout
                        - name: kaniko-process
                          dependencies: [clone]
                          arguments:
                            parameters:
                              - name: FROM_ARGO
                                value: "{{workflow.parameters.FROM_ARGO}}"
                              - name: image_name
                                value: "{{workflow.parameters.image_name}}"
                              - name: image_tag
                                value: "{{tasks.clone.outputs.parameters.image-tag}}"
                            artifacts:
                              - name: source-code
                                from: "{{tasks.clone.outputs.artifacts.source-code}}"
                          templateRef:
                            name: image-build
                            template: build-push
                        - name: helm-push
                          dependencies: [kaniko-process]
                          arguments:
                            parameters:
                              - name: image-tag
                                value: "{{tasks.clone.outputs.parameters.image-tag}}"
                          templateRef:
                            name: chart-push
                            template: change-push
      retryStrategy:
        steps: 3
```

The event information will not be used so it was deleted.  
Triggered workflow must be executed instantly, so we specify the required values in advance.

After saving, you can check the following event flow.

![Event flow](img/4-4-event-flow.png)

## Test CI pipeline

For testing, generate events through MinIO again.  
We can see that the workflow runs normally.

![Workflow triggered](img/4-4-wf-trigger.png)

A new image with the tag `1.0.0` has been pushed to Docker Hub as well.

![Docker Hub check](img/4-4-docker-hub-check.png)

Lastly, we can also see the `1.0.0` value on Helm chart in Github repo.

![Repository push check (by event)](img/4-4-event-push-check.png)

[^1]: https://argoproj.github.io/argo-events/eventsources/setup/github/

[yq]: https://github.com/mikefarah/yq
