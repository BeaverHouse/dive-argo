---
sidebar_position: 3
---

# MetalLB 설치하기

MetalLB는 Bare Metal 환경의 K8S 환경에서 사용 가능한 Load-Balancer입니다.  
MetalLB를 사용하면 클라우드 공급자(GCP, AWS, Azure 등)의 도움 없이도 서비스를 외부에 공개할 수 있습니다.

## MetalLB Helm chart 다운로드

다음 Repository에서 Helm chart를 다운로드합니다.  
https://github.com/metallb/metallb

## Namespace 생성하기

MetalLB는 크게 2종류의 Pod를 생성하는데, External IP를 부여하고 관리하는 controller와 실제 외부 트래픽과 서비스를 연결해 주는 speaker가 있습니다.

speaker Pod는 이 네트워크 기능을 위해 좀 더 높은 권한이 필요합니다. speaker Pod에 권한을 부여하기 위해[^1] 다음과 같이 Namespace 설정 파일을 생성합니다.

```yaml title="metallb-ns.yaml"
apiVersion: v1
kind: Namespace
metadata:
  name: metallb-system
  labels:
    pod-security.kubernetes.io/enforce: privileged
    pod-security.kubernetes.io/audit: privileged
    pod-security.kubernetes.io/warn: privileged
```

설정이 완료되면 다음 명령어로 Namespace를 생성합니다.

```
kubectl apply -f ./metallb-ns.yaml
```

## Helm chart 설치하기

설치하기 전에 chart에서 MetalLB 버전을 설정해야 합니다.  
chart를 관찰해 보면 controller와 speaker 이미지를 가져올 때 태그가 필요하며  
`Chart.yaml` 파일의 `appVersion` 값을 기본값으로 사용하고 있습니다.  
이를 최신 버전인 `v0.13.12` 로 설정하겠습니다.

```yaml title="Chart.yaml" {17}
apiVersion: v2
name: metallb
description: A network load-balancer implementation for Kubernetes using standard

(...)

# This is the chart version. This version number should be incremented each time you make changes
# to the chart and its templates, including the app version.
# Versions are expected to follow Semantic Versioning (https://semver.org/)
# NOTE: this value is updated by the metallb release process
version: 1.0.0

# This is the version number of the application being deployed. This version number should be
# incremented each time you make changes to the application. Versions are not expected to
# follow Semantic Versioning. They should reflect the version the application is using.
# NOTE: this value is updated by the metallb release process
appVersion: v0.13.12
```

이제 Helm으로 MetalLB를 설치합니다.

```
helm install metallb -n metallb-system ./metallb
```

![MetalLB speaker pod check](./img/2-3-metallb-speaker.png)

기본적으로 speaker Pod는 모든 노드를 대상으로 한 DaemonSet으로 배포됩니다.  
위 사진처럼 노드 개수만큼 speaker Pod가 확인되면 정상적으로 MetalLB가 설치된 것입니다.

## Layer 2 config 설정하기

다음으로는 앱 생성시 Service에 External IP가 할당되도록 Layer 2 config를 설정하겠습니다.

:::caution
MetalLB의 Layer 2 mode는 speaker 중 Leader를 선출하여 그 곳에 External IP를 할당합니다. 따라서 하나의 노드에 모든 트래픽이 집중되는 방식으로 진정한 Load-Balancing이라고 할 수 없으며, Leader가 다운될 경우 다른 노드의 speaker로 역할이 넘어가는 failover 방식을 채택하고 있습니다.  
MetalLB를 Load-Balancing 목적으로 사용하기 위해서는 BGP mode + 추가적인 라우터 설정이 필요합니다.  
Layer 2 mode에 대한 자세한 내용은 아래 링크를 참고해 주세요.

https://metallb.universe.tf/concepts/layer2/
:::

아래 링크를 참조하여 다음과 같은 설정 파일을 생성합니다.  
IP 범위는 허용 범위 내에서 자유롭게 변경하시면 됩니다.  
https://metallb.universe.tf/configuration/#layer-2-configuration

<!-- TODO: 복기하면서 Helm chart에 통합 -->

```yaml title="metallb-ipconfig.yaml"
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: metallb-pool
  namespace: metallb-system
spec:
  addresses:
    - 192.168.0.200-192.168.0.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: metallb-advertise
  namespace: metallb-system
```

설정이 완료되면 다음 명령어로 Object를 생성합니다.

```
kubectl apply -f ./metallb-ipconfig.yaml
```

## MetalLB 테스트하기

테스트를 위한 Pod를 하나 생성하겠습니다.

```yaml title="nginx-sample.yaml"
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    env: test
spec:
  containers:
    - name: nginx
      image: nginx
      imagePullPolicy: IfNotPresent
  nodeSelector:
    kubernetes.io/hostname: k3s-worker-2
```

Pod를 생성하고, 서비스로 80번 포트를 개방합니다.

```
kubectl apply -f ./nginx-sample.yaml

kubectl expose pod nginx --type=LoadBalancer --name=lb-nginx --port=80

kubectl get svc
```

![kubectl expose check](./img/2-3-expose-test-kubectl.png)

정상적으로 External IP가 할당되었습니다.  
브라우저에서 해당 주소로 접속해 보면, NGINX 페이지를 확인할 수 있습니다.

![Test on browser](./img/2-3-expose-test-browser.png)

[^1]: https://metallb.universe.tf/installation/#installation-with-helm

<!--Re-edited on 240120-->
