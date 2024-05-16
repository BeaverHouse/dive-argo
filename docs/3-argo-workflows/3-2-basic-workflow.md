---
sidebar_position: 2
---

# Workflow 기본

Argo Workflows의 UI를 둘러보고, 간단한 Workflow를 직접 생성하고 실행해 봅시다.

## Workflow 리스트 보기

Argo Workflows에 로그인하면 첫 페이지에서 Workflow 리스트를 확인할 수 있습니다.  
그런데 default로 설정되어 있을 수 있는 `undefined` 를 포함하여 `argo-wf` 외의 다른 Namespace가 선택되어 있으면 다음처럼 오류가 발생합니다.

![Workflow list error](img/3-2-list-error.png)

이는 설정한 ServiceAccount가 `argo-wf` Namespace에 만들어져 해당 Namespace 내에서만 권한을 가지고 있기 때문입니다.

![Workflow list error resolved](img/3-2-list-normal.png)

Namespace를 `argo-wf` 로 설정하면 에러가 사라집니다.

:::info  
Argo Workflows가 이렇게 동작하는 것은 기본적으로 클러스터 내의 모든 Namespace를 모니터링하도록 설정이 되어 있기 때문입니다. 하지만 ServiceAccount의 권한이 모두 다르기 때문에 이렇게 권한에 따른 액세스 문제가 발생할 수 있습니다.  
Argo가 설치된 Namespace에서만 Workflow를 실행할 수 있도록 설정을 변경할 수 있고, Helm chart에서는 `singleNamespace` 옵션으로 이를 제어할 수 있습니다. 또한 Workflow를 실행할 Namespace를 지정할 수 있는 Managed Namespace 옵션도 존재합니다.  
자세한 내용은 아래 링크를 참조해 주세요.

https://argo-workflows.readthedocs.io/en/latest/installation/
:::

## 첫 Workflow 작성하기

이제 가장 기본적인 Workflow를 작성해 보겠습니다.

### Workflow Template 저장하기

Workflow Template로 Workflow의 일부 또는 전체를 저장할 수 있습니다.  
먼저 template로 일부를 저장하고 이를 reference로 호출하여 사용해 보겠습니다.

**Workflow Templates** 메뉴에서 **CREATE NEW WORKFLOW TEMPLATE**를 누릅니다.

![Create WorkflowTemplate](img/3-2-create-template.png)

Argo Workflows 문서의 샘플을 약간 수정해서 사용하겠습니다.  
기존의 데이터를 지우고 아래 내용을 붙여넣습니다.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: whalesay-template
spec:
  templates:
    - name: whalesay
      inputs:
        parameters:
          - name: message
            value: "hello world"
      container:
        image: docker/whalesay
        command: [cowsay]
        args: ["{{inputs.parameters.message}}"]
```

고래 모양의 메시지와 `message` 변수로 입력받은 `hello world`를 출력하는 아주 간단한 내용입니다.  
**CREATE** 버튼을 누르면 Workflow Template이 만들어집니다.

![Template created](img/3-2-template-created.png)

`kubectl` 명령어로도 생성된 Template을 확인할 수 있습니다.

```
kubectl get workflowtemplate -n argo-wf
```

### Workflow 생성하기

Workflow도 생성해 보도록 하겠습니다.  
**Workflows** 메뉴로 돌아가 **SUBMIT NEW WORKFLOW** 버튼을 누릅니다.

![Submit workflow](img/3-2-submit-wf.png)

Edit using full workflow options를 선택하고 아래 내용을 붙여넣습니다.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: whalesay-workflow-
spec:
  entrypoint: whalesay
  templates:
    - name: whalesay
      steps:
        - - name: ref-template
            templateRef:
              name: whalesay-template
              template: whalesay
```

기존에 만들었던 Workflow Template에 있는 `whalesay`의 내용을 사용하여 Workflow를 생성합니다.  
`generateName` 으로 설정한 Prefix 뒤에 랜덤 tag가 붙어 Workflow를 구분할 수 있도록 하고, `entrypoint` 로 시작 지점을 설정했습니다. 여기에서는 하나의 process만 있는데, 여러 process가 있을 때에도 그 중에서 `entrypoint`를 설정할 수 있습니다.

![Run workflow](img/3-2-run-wf.png)

**CREATE** 버튼을 누르고 기다리면 Workflow가 실행되는 것을 확인할 수 있습니다.

### Workflow 로그 확인하기

![Workflow log cannot be checked](img/3-2-wf-no-log.png)

그런데 실행 확인을 위해 Logs를 클릭해 보면 아무 내용이 나오지 않습니다.  
Workflow가 제대로 작동하지 않은 걸까요?

![Workflow kubectl check](img/3-2-wf-kubectl.png)

`kubectl` 로 확인해 보면 정상적으로 실행이 되었습니다.  
실제로 개발자 도구로 확인해 보면 로그를 불러오는 API가 403 Forbidden을 반환하는 것이 원인임을 확인할 수 있습니다.

![API returns 403 on dev tools](img/3-2-log-error.png)

이는 현재 저희가 Argo에 접속중인 ServiceAccount가 Pod에 관련된 권한을 가지고 있지 않기 때문입니다. 저희가 ServiceAccount에 연결한 ClusterRole은 `workflow-aggregate-roles.yaml`에 있는데, 살펴보면 Workflow에 대한 권한만 있고 Pod에 관한 권한이 없다는 것을 확인할 수 있습니다.  
권한을 부여하기 위해서 Role과 RoleBinding을 추가로 작성해 보겠습니다.

<!-- prettier-ignore -->
```yaml title="pod-reader.yaml"
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: {{ .Release.Namespace | quote }}
  name: pod-reader
rules:
  - apiGroups: [""] # "" indicates the core API group
    resources: ["pods", "pods/log"]
    verbs: ["get", "watch", "list"]
```

<!-- prettier-ignore -->
```yaml title="rb-admin-pod.yaml"
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: huadmin-pod-rb
  namespace: {{ .Release.Namespace | quote }}
subjects:
  - kind: ServiceAccount
    name: huadmin
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

`helm upgrade` 등으로 변경사항을 반영합니다.  
다시 Workflow를 만들어 실행하고 로그를 확인하면 이번에는 정상적으로 출력됩니다.

![Log issue is fixed](img/3-2-wf-log-resolved.png)

### Workflow 저장하여 생성하기

부분 template 뿐만 아니라 전체 Workflow도 저장을 할 수 있습니다.  
Workflow Template 메뉴에서 **CREATE NEW WORKFLOW TEMPLATE**를 누르고,  
이번에는 위에서 사용했던 Workflow의 내용을 붙여넣고 저장합니다.

:::info

1. 여기서는 위 내용을 그대로 복사해 Workflow 형식으로 저장했는데,  
   당연히 WorkflowTemplate 형식으로 저장해도 동일하게 작동합니다.
2. `metadata.generateName` 대신 `metadata.name` 을 사용하여 고정된 이름으로 저장할 수 있습니다.  
   실행할 때는 비슷하게 뒤에 random tag가 붙습니다.

:::

![Store workflow as template](img/3-2-store-wf.png)

만들어진 Workflow는 **SUBMIT** 버튼을 통해 간편하게 실행할 수 있습니다.

![Submit workflow from template](img/3-2-submit-stored-wf.png)

![Workflow result log](img/3-2-stored-wf-log.png)
