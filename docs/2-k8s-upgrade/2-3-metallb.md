---
sidebar_position: 3
---

# MetalLB와 NGINX Ingress Controller로 서비스 노출하기

## MetalLB helm chart 다운로드

helm chart 다운로드
https://github.com/metallb/metallb/tree/main

## Namespace 생성

speaker Pod에 권한을 주기 위해 다음과 같이 namespace 생성[^1]

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

```
kubectl apply -f ./metallb-ns.yaml
```

## 설치하기

helm chart에서 MetalLB 버전을 설정해야 한다  
chart를 관찰해 보면 controller와 speaker image를 불러올 때 태그를 받고 있으며  
`Chart.yaml`의 `appVersion`을 default로 사용하고 있음  
이를 최신 버전인 `v0.13.12`로 맞춰 준다

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

MetalLB 설치

```
helm install metallb -n metallb-system ./metallb
```

![speaker](./img/2-3-speaker.png)

layer 2 config 설정, ip는 입맛대로
https://metallb.universe.tf/configuration/#layer-2-configuration

```
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: metallb-pool
  namespace: metallb-system
spec:
  addresses:
    - 192.168.1.240-192.168.1.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: metallb-advertise
  namespace: metallb-system
```

kubectl apply -f ./metallb-ipconfig.yaml

## 테스트

kubectl apply -f ./nginx-sample.yaml

kubectl get pod -o wide

kubectl expose pod nginx --type=LoadBalancer --name=lb-nginx --port=80

![Alt text](./img/2-3-expose-test.png)

[^1]: https://metallb.universe.tf/installation/#installation-with-helm
