---
sidebar_position: 4
---

# CI Workflow 구축하기

기본적인 Workflow 구성법을 익혔으니, 실제 App에 대한 CI 과정을 구성해 보겠습니다.
CI 과정에서는 보통 Code 작업, Build와 Test까지 포함되지만[^1] 여기서는 Build에 집중할 것이고 Code 작업과 Test에 대해서는 설명하지 않겠습니다.

최종적인 목표는 `git push` 를 하면 자동으로 Workflow를 감지하여 이미지를 빌드하고 업로드하는 것이지만, `git push` 감지는 Argo Workflows 외에 Argo Events라는 다른 앱이 필요합니다. 그러니 우선은 Workflow만 우선 구성해 보겠습니다. 


## Workflow Overview
0. Git 주소를 변수로 받습니다.
1. `git clone` 을 합니다.
2. 루트 폴더에서 `Dockerfile` 을 사용해 이미지를 빌드합니다. 여기서는 Kaniko를 사용합니다.
3. 만든 이미지를 Docker Hub에 Push합니다.  
Harbor 등의 다른 Repository에 업로드도 가능하지만 논점을 벗어나므로 여기서는 다루지 않겠습니다.

Kaniko는 Docker daemon을 사용하지 않기 때문에 여러 이점이 있습니다.

## Sample App 선정

Sample App을 구축했습니다.  
꼭 이 소스를 사용할 필요는 없고, 빌드하여 배포가 가능하면 뭐든 상관없습니다.

https://github.com/BeaverHouse/dive-argo-fastapi

## Workflow 구성

각각의 Step을 WorkflowTemplate으로 작성하고 합치겠습니다.

### Git Clone

https://helm.sh/docs/howto/charts_tips_and_tricks/#creating-image-pull-secrets

https://kubernetes.io/ko/docs/tasks/configure-pod-container/pull-image-private-registry/

```yaml title="values.yaml"
(...)
# Add this below
imageCredentials:
  registry: https://index.docker.io/v1/ # for Docker Hub
  username: your-name
  password: your-pw
  email: your@mail.com
```

```tpl title="_helpers.tpl"
{{- define "imagePullSecret" }}
{{- with .Values.imageCredentials }}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"email\":\"%s\",\"auth\":\"%s\"}}}" .registry .username .password .email (printf "%s:%s" .username .password | b64enc) | b64enc }}
{{- end }}
{{- end }}
```

```yaml title="docker-secret.yaml"
apiVersion: v1
kind: Secret
metadata:
  name: docker-secret
  namespace: {{ .Release.Namespace | quote }}
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: {{ template "imagePullSecret" . }}
```

![docker secret check](img/3-4-docker-secret-check.png)

```yaml title="git-clone.yaml"
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: git-clone
spec:
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
    container:
      image: bash:latest
      command: [ls]
      args: ["/code"]
```

![git clone failed](img/3-4-git-clone-fail.png)

### MinIO 설치

https://github.com/bitnami/charts/tree/main/bitnami/minio

values에서 service.type과 service.loadBalancerIP 설정

```
helm dependency update ./minio
helm install minio ./minio -n minio --create-namespace
```

`<SOME-IP>:9000`으로 접속 가능

계정 정보
```
export ROOT_USER=$(kubectl get secret --namespace minio minio -o jsonpath="{.data.root-user}" | base64 -d)
   export ROOT_PASSWORD=$(kubectl get secret --namespace minio minio -o jsonpath="{.data.root-password}" | base64 -d)
```

![minio login](img/3-4-minio.png)

argo-bucket 이라는 이름으로 bucket 하나 생성

```yaml
artifactRepository:
  # -- Archive the main container logs as an artifact
  archiveLogs: false
  # -- Store artifact in a S3-compliant object store
  # @default -- See [values.yaml]
  s3:
    # # Note the `key` attribute is not the actual secret, it's the PATH to
    # # the contents in the associated secret, as defined by the `name` attribute.
    accessKeySecret:
      name: minio
      key: accesskey
    secretKeySecret:
      name: minio
      key: secretkey
    # insecure will disable TLS. Primarily used for minio installs not configured with TLS
    insecure: false
    bucket: argo-bucket
    endpoint: minio.minio.svc.cluster.local:9000
```

[^1]: https://about.gitlab.com/topics/ci-cd/